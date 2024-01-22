import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { packs } from './entities/pack.entity';
import { UpdatePackDto } from './dto/update-pack.dto';
import { productos } from '../infraestructure/microservice/entities/productos.entity';
import { parametros } from '../infraestructure/microservice/entities/parametros.entity';
import { productoslocal } from '../infraestructure/microservice/entities/productoslocal.entity';
import { stockproductostienda } from '../infraestructure/microservice/entities/stockproductostienda.entity';
import { preciostipocliente } from '../infraestructure/microservice/entities/preciostipocliente.entity';
import { movimientos } from '../infraestructure/microservice/entities/movimientos.entity';

@Injectable()
export class PacksService {
  private readonly logger = new Logger('PackService');

  constructor(
    @InjectRepository(movimientos)
    private readonly movimientosRepository: Repository<movimientos>,

    @InjectRepository(packs)
    private readonly packRepository: Repository<packs>,

    @InjectRepository(productos)
    private productRepository: Repository<productos>,

    @InjectRepository(parametros)
    private parameterRepository: Repository<parametros>,

    @InjectRepository(productoslocal)
    private productosLocalRepository: Repository<productoslocal>,

    @InjectRepository(stockproductostienda)
    private stockproductostienda: Repository<stockproductostienda>,

    @InjectRepository(preciostipocliente)
    private preciostipocliente: Repository<preciostipocliente>,
  ) {}
  async create(createPackDto: any) {
    try {
      const productosIds = createPackDto.productos.map(
        (producto) => producto.idproducto,
      );

      // Obtener información de productos en una sola consulta
      const productosInfo = await this.productRepository.find({
        where: { idproducto: In(productosIds) },
      });

      // Obtener información productos en local
      const productosLocal = await this.productosLocalRepository.find({
        where: {
          idproducto: In(productosInfo.map((info) => info.idproducto)),
          idlocal: createPackDto.idlocal,
        },
      });

      // Obtener stock de productos
      const stockProductos = await this.stockproductostienda.find({
        where: {
          idproductolocal: In(
            productosLocal.map((local) => local.idproductolocal),
          ),
        },
      });

      // Validar stock
      for (let i = 0; i < createPackDto['productos'].length; i++) {
        const producto = createPackDto['productos'][i];
        const infoProduct = productosInfo.find(
          (info) => info.idproducto === producto.idproducto,
        );

        const localProduct = productosLocal.find(
          (local) => Number(local.idproducto) === producto.idproducto,
        );

        const stockProduct = stockProductos.find(
          (stock) =>
            Number(stock.idproductolocal) === localProduct.idproductolocal &&
            stock.idtienda === localProduct.idlocal,
        );

        const requiredStock =
          createPackDto.packquantity * producto.productquantity;

        if (requiredStock > Number(stockProduct.stock)) {
          const errorMessage = `Hay ${stockProduct.stock} unidades de ${infoProduct.producto}. Para crear el pack se necesitan ${requiredStock}.`;
          throw new BadRequestException({ message: errorMessage });
        }

        this.logger.log(`SE VALIDÓ EL STOCK DE: ${infoProduct.producto}`);
      }

      // Si todas las validaciones de stock son exitosas, realizar las actualizaciones
      for (let i = 0; i < createPackDto['productos'].length; i++) {
        const producto = createPackDto['productos'][i];
        const localProduct = productosLocal.find(
          (local) => Number(local.idproducto) === producto.idproducto,
        );
        const stockProduct = stockProductos.find(
          (stock) =>
            Number(stock.idproductolocal) === localProduct.idproductolocal &&
            stock.idtienda === localProduct.idlocal,
        );

        const requiredStock =
          createPackDto.packquantity * producto.productquantity;

        // Restar la cantidad del stock
        await this.stockproductostienda.update(
          { idproductolocal: stockProduct.idproductolocal },
          {
            stock: Number(stockProduct.stock) - requiredStock,
            stock_unidades: Number(stockProduct.stock_unidades) - requiredStock,
            stock_presentacion:
              Number(stockProduct.stock_presentacion) - requiredStock,
          },
        );
        this.logger.log('SE RESTÓ EL STOCK DE LOS PRODUCTOS');

        // Agregar la resta de productos en la tabla movimientos
        const movimiento = this.movimientosRepository.create({
          idtipomovimiento: 16,
          idstockproductotienda: stockProduct.idstockproductotienda,
          salida: requiredStock,
          entrada: null,
          idusuario: 1,
          stockfinal: Number(stockProduct.stock) - requiredStock,
          detalle: `{tipo: PACK, Nombre del Pack: ${createPackDto.producto}`,
        });
        await this.movimientosRepository.save(movimiento);

        this.logger.log('SE AGREGÓ EL MOVIMIENTO EN LA TABLA DE PRODUCTOS');
      }

      // OPTIMIZAR: Crear el pack en tabla productos con datos por default (/save)
      const result = await this.productRepository.query(
        'SELECT sch_main.fn_producto_register();',
      );

      const idProductoPadre = await result[0].fn_producto_register.idproducto;

      // Actualizar el producto padre, el hijo y las presentaciones
      const productoLocal = await this.updateProduct(
        createPackDto,
        idProductoPadre,
      );

      // Ingresar el stock según el local
      const stockProductosTienda = this.stockproductostienda.create({
        idproductolocal: productoLocal.idproductolocal,
        idtienda: createPackDto.idlocal,
        stock: createPackDto.packquantity,
        stock_unidades: createPackDto.packquantity,
        stock_presentacion: createPackDto.packquantity,
      });

      await this.stockproductostienda.save(stockProductosTienda);

      // Ingresar los precios según el cliente

      const tiposClientes: number[] = [3, 4];

      for (const idTipoCliente of tiposClientes) {
        const preciosTipoCliente = this.preciostipocliente.create({
          idproductolocal: productoLocal.idproductolocal,
          idtipocliente: idTipoCliente,
          desde: 1,
          hasta: 10000,
          precio: productoLocal.precioestandar,
          idestado: 3,
        });

        await this.preciostipocliente.save(preciosTipoCliente);
      }

      // Insertar pack en la base de datos
      for (let i = 0; i < productosIds.length; i++) {
        const newPack = {
          idproductopadre: idProductoPadre,
          idproductobase: productosIds[i],
          productbasequantity: createPackDto['productos'][i].productquantity,
        };
        const createdPack = this.packRepository.create(newPack);
        return await this.packRepository.save(createdPack);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  findAll() {
    return `This action returns all packs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pack`;
  }

  update(id: number, updatePackDto: UpdatePackDto) {
    return `This action updates a #${id} pack`;
  }

  remove(id: number) {
    return `This action removes a #${id} pack`;
  }

  async updateProduct(productData: any, idproducto: number) {
    // Obtener valores predeterminados
    try {
      const subclaseDefault = await this.parameterRepository.findOne({
        where: { nombre: 'SUBCLASE_DEFAULT' },
      });

      const unidadDefault = await this.parameterRepository.findOne({
        where: { nombre: 'UNIDAD_DEFAULT' },
      });

      // Obtener producto padre
      const parentProduct = await this.productRepository.findOne({
        where: { idproducto },
      });

      //ID de producto hijo
      const idChildProduct = idproducto + 1;

      if (parentProduct) {
        // Actualizar los campos del producto padre
        parentProduct.producto = productData.producto;
        parentProduct.nombrecomercial = productData.producto;
        parentProduct.idsubclase = parseInt(subclaseDefault.valor);
        parentProduct.idmarca = parseInt(productData.marca.idmarca);
        parentProduct.idunidadmedida = parseInt(unidadDefault.valor);
        parentProduct.cobertura_min = productData.cobertura_min;
        parentProduct.cobertura_max = productData.cobertura_max;

        // Guardar el producto padre actualizado en la base de datos
        await this.productRepository.save(parentProduct);

        // Actualizar el producto hijo actualizado en la base de datos
        await this.productRepository.update(
          { idproducto: idChildProduct },
          {
            producto: parentProduct.producto,
            idmarca: parentProduct.idmarca,
            cobertura_min: parentProduct.cobertura_min,
            cobertura_max: parentProduct.cobertura_max,
            nombrecomercial: parentProduct.producto,
          },
        );

        // Actualizar productos de cada local
        const childProductToUpdate = await this.productosLocalRepository.find({
          where: { idproducto: idChildProduct },
        });

        for (const productoLocal of childProductToUpdate) {
          productoLocal.costo = productData.costo;

          if (parseInt(String(productoLocal.idlocal)) === productData.idlocal) {
            productoLocal.precioestandar = productData.costo;
            productoLocal.porcentajeganancia = productData.porcentajeganancia;
          }
          await this.productosLocalRepository.save(productoLocal);
        }

        return await this.productosLocalRepository.findOne({
          where: { idlocal: productData.idlocal, idproducto: idChildProduct },
        });
        /*// Elimina los proveedores existentes
        await this.productProviderRepository.delete({ product_id: productId });

        // Agrega los nuevos proveedores
        for (const provider of productData.proveedores) {
          const newProductProvider = this.productProviderRepository.create({
            provider_id: provider.idproveedor,
            product_id: productId,
          });
          await this.productProviderRepository.save(newProductProvider);
        }*/

        //return updatedProduct;
      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (error) {
      console.error(error);
    }
  }
}
