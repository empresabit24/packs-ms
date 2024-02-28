import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CreatePackDto } from '../dto/create-pack.dto';

import {
  movimientos,
  parametros,
  preciostipocliente,
  productos,
  productoslocal,
  stockproductostienda,
} from '../../infraestructure/microservice/entities';
import { packs } from '../entities/pack.entity';
import { productospack } from '../entities/productospack.entity';

@Injectable()
export class PacksService {
  private readonly logger = new Logger('PackService');

  constructor(
    @InjectRepository(movimientos)
    private readonly movimientosRepository: Repository<movimientos>,

    @InjectRepository(packs)
    private readonly packsRepository: Repository<packs>,

    @InjectRepository(productospack)
    private readonly productosPackRepository: Repository<productospack>,

    @InjectRepository(productos)
    private productosRepository: Repository<productos>,

    @InjectRepository(parametros)
    private parametrosRepository: Repository<parametros>,

    @InjectRepository(productoslocal)
    private productosLocalRepository: Repository<productoslocal>,

    @InjectRepository(stockproductostienda)
    private stockProductosTiendaRepository: Repository<stockproductostienda>,

    @InjectRepository(preciostipocliente)
    private preciosTipoClienteRepository: Repository<preciostipocliente>,
  ) {}
  async create(createPackDto: CreatePackDto) {
    try {
      const productosIds = createPackDto.productos.map(
        (producto) => producto.idproducto,
      );

      // Obtener información de productos en una sola consulta
      const productosInfo = await this.productosRepository.find({
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
      const stockProductos = await this.stockProductosTiendaRepository.find({
        where: {
          idproductolocal: In(
            productosLocal.map((local) => Number(local.idproductolocal)),
          ),
        },
      });

      // Validar stock
      for (let i = 0; i < createPackDto['productos'].length; i++) {
        const producto = createPackDto['productos'][i];
        const infoProduct = productosInfo.find(
          (info) => info.idproducto === Number(producto.idproducto),
        );

        const localProduct = productosLocal.find(
          (local) => Number(local.idproducto) === Number(producto.idproducto),
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
          throw new BadRequestException(errorMessage);
        }

        this.logger.log(`SE VALIDÓ EL STOCK DE: ${infoProduct.producto}`);
      }

      // Si todas las validaciones de stock son exitosas, realizar las actualizaciones
      for (let i = 0; i < createPackDto['productos'].length; i++) {
        const producto = createPackDto['productos'][i];
        const localProduct = productosLocal.find(
          (local) => Number(local.idproducto) === Number(producto.idproducto),
        );

        const stockProduct = stockProductos.find(
          (stock) =>
            Number(stock.idproductolocal) ===
              Number(localProduct.idproductolocal) &&
            Number(stock.idtienda) === Number(localProduct.idlocal),
        );

        const requiredStock =
          createPackDto.packquantity * producto.productquantity;

        // Restar la cantidad del stock
        await this.stockProductosTiendaRepository.update(
          { idproductolocal: Number(stockProduct.idproductolocal) },
          {
            stock: Number(stockProduct.stock) - requiredStock,
            stock_unidades: Number(stockProduct.stock_unidades) - requiredStock,
            stock_presentacion:
              Number(stockProduct.stock_presentacion) - requiredStock,
          },
        );
        this.logger.log(
          `SE RESTÓ EL STOCK DE PRODUCTO CON ID: ${localProduct.idproducto}`,
        );

        // Agregar la resta de productos en la tabla movimientos
        const movimiento = this.movimientosRepository.create({
          idtipomovimiento: 16,
          idstockproductotienda: stockProduct.idstockproductotienda,
          salida: requiredStock,
          entrada: null,
          idusuario: 1,
          stockfinal: Number(stockProduct.stock) - requiredStock,
          detalle: `{"tipo": "CREAR PACK", "PACK": "${createPackDto.producto}"}`,
        });
        await this.movimientosRepository.save(movimiento);

        this.logger.log(
          `SE AGREGÓ EL MOVIMIENTO DE PRODUCTO CON ID: ${localProduct.idproducto}`,
        );
      }

      // Crear el pack en tabla productos con datos por default (/save)
      const result = await this.productosRepository.query(
        'SELECT sch_main.fn_producto_register();',
      );

      const idProductoPadre = await result[0].fn_producto_register.idproducto;

      // Actualizar el producto padre, el hijo y las presentaciones (fn_producto_register(data, id) -> en código)
      const productoLocal = await this.updateProduct(
        createPackDto,
        idProductoPadre,
      );
      this.logger.log(
        `SE CREÓ EL PRODUCTO PADRE E HIJO EN LA TABLA DE PRODUCTOS`,
      );

      // Ingresar el stock del pack según el local
      const updatedStockProductosTienda = {
        stock: createPackDto.packquantity,
        stock_unidades: createPackDto.packquantity,
        stock_presentacion: createPackDto.packquantity,
      };
      await this.stockProductosTiendaRepository
        .createQueryBuilder()
        .update()
        .set(updatedStockProductosTienda)
        .where('idproductolocal = :productId AND idtienda = :storeId', {
          productId: Number(productoLocal.idproductolocal),
          storeId: createPackDto.idlocal,
        })
        .execute();
      const { idstockproductotienda } =
        await this.stockProductosTiendaRepository.findOne({
          where: {
            idproductolocal: Number(productoLocal.idproductolocal),
            idtienda: createPackDto.idlocal,
          },
        });

      this.logger.log(
        `SE AGREGÓ EL STOCK DEL PACK EN EL LOCAL ${createPackDto.idlocal}`,
      );

      // Ingresar los precios según el cliente

      const tiposClientes: number[] = [3, 4];

      await Promise.all(
        tiposClientes.map(async (idTipoCliente) => {
          const preciosTipoCliente = this.preciosTipoClienteRepository.create({
            idproductolocal: Number(productoLocal.idproductolocal),
            idtipocliente: idTipoCliente,
            desde: 1,
            hasta: 10000,
            precio: productoLocal.precioestandar,
            idestado: 3,
          });

          await this.preciosTipoClienteRepository.save(preciosTipoCliente);
        }),
      );

      // Insertar pack en la base de datos
      const nuevoPack = this.packsRepository.create({
        idproducto: productoLocal.idproducto,
      });
      const { idpack } = await this.packsRepository.save(nuevoPack);

      for (let i = 0; i < createPackDto['productos'].length; i++) {
        const nuevoProductoPack = {
          idpack: idpack,
          idproducto: productosIds[i],
          productquantity: createPackDto['productos'][i].productquantity,
        };
        const createdPack =
          this.productosPackRepository.create(nuevoProductoPack);
        await this.productosPackRepository.save(createdPack);
      }
      this.logger.log(`SE INSERTÓ EL PACK EN LA BASE DE DATOS`);

      // Agregar movimiento de creación de pack
      const movimiento = this.movimientosRepository.create({
        idtipomovimiento: 16,
        idstockproductotienda: idstockproductotienda,
        salida: null,
        entrada: createPackDto.packquantity,
        idusuario: 1,
        stockfinal: createPackDto.packquantity,
        detalle: `{"tipo": "CREAR PACK", "PACK": "${createPackDto.producto}"}`,
      });
      await this.movimientosRepository.save(movimiento);
      return {
        message: `El pack '${createPackDto.producto}' [${createPackDto.packquantity} unidades] se creó correctamente.`,
        success: true,
      };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(`${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(idlocal: number): Promise<packs[]> {
    return await this.packsRepository
      .createQueryBuilder('pack')
      .innerJoinAndSelect('pack.infoPack', 'producto')
      .innerJoinAndSelect('producto.marca', 'marca')
      .innerJoinAndSelect('producto.infoProductoLocal', 'infoPackLocal')
      .leftJoinAndSelect('infoPackLocal.stockPacksLocal', 'stockpack')
      .select([
        'pack.idpack',
        'pack.idproducto',
        'pack.creationdate',
        'producto.producto',
        'producto.sku',
        'producto.idestado',
        'marca',
        'infoPackLocal.idproductolocal',
        'infoPackLocal.idlocal',
        'stockpack.stock',
      ])
      .where('infoPackLocal.idlocal = :idlocal', { idlocal: idlocal })
      .getMany();
  }

  async findOne(id: number, idlocal: number) {
    const [result] = await Promise.all([
      this.packsRepository
        .createQueryBuilder('pack')
        .innerJoinAndSelect('pack.productos', 'productospack')
        .innerJoinAndSelect('pack.infoPack', 'infoPack')
        .innerJoinAndSelect('infoPack.infoProductoLocal', 'infoPackLocal')
        .innerJoinAndSelect('productospack.producto', 'productos')
        .innerJoinAndSelect('productos.infoProductoLocal', 'infoProductoLocal')
        .innerJoinAndSelect(
          'infoProductoLocal.stockPacksLocal',
          'stockproductolocal',
        )
        .select([
          'pack',
          'productospack',
          'infoPack',
          'infoPackLocal',
          'productos',
          'infoProductoLocal',
          'stockproductolocal.stock', // Selecciona solo el campo 'stock'
        ])
        .where('pack.idpack = :idpack', { idpack: id })
        .andWhere('infoPackLocal.idlocal = :idlocal', { idlocal: idlocal })
        .andWhere('infoProductoLocal.idlocal = :idlocal', { idlocal: idlocal }),
    ]);

    const query = result.getQuery();
    console.log(query);

    const newResult = await result.getOne();

    if (!newResult) {
      throw new NotFoundException(`Pack with id ${id} not found`);
    }
    return newResult;
  }

  async updateProduct(productData: any, idproducto: number) {
    // Obtener valores predeterminados
    try {
      const subclaseDefault = await this.parametrosRepository.findOne({
        where: { nombre: 'SUBCLASE_DEFAULT' },
      });

      const unidadDefault = await this.parametrosRepository.findOne({
        where: { nombre: 'UNIDAD_DEFAULT' },
      });

      // Obtener producto padre
      const parentProduct = await this.productosRepository.findOne({
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
        parentProduct.ispack = true;

        // Guardar el producto padre actualizado en la base de datos
        await this.productosRepository.save(parentProduct);

        // Actualizar el producto hijo actualizado en la base de datos
        await this.productosRepository.update(
          { idproducto: idChildProduct },
          {
            producto: parentProduct.producto,
            idmarca: parentProduct.idmarca,
            cobertura_min: parentProduct.cobertura_min,
            cobertura_max: parentProduct.cobertura_max,
            nombrecomercial: parentProduct.producto,
            ispack: true,
          },
        );

        // Actualizar productos de cada local
        const childProductToUpdate = await this.productosLocalRepository.find({
          where: { idproducto: idChildProduct },
        });

        for (const productoLocal of childProductToUpdate) {
          productoLocal.costo = productData.costo;

          if (parseInt(String(productoLocal.idlocal)) === productData.idlocal) {
            productoLocal.precioestandar = productData.precioestandar;
            productoLocal.porcentajeganancia = productData.porcentajeganancia;
          }
          await this.productosLocalRepository.save(productoLocal);
          const stockPack = this.stockProductosTiendaRepository.create({
            idproductolocal: productoLocal.idproductolocal,
            idtienda: productData.idlocal,
            stock: 0,
            stock_unidades: 0,
            stock_presentacion: 0,
          });

          await this.stockProductosTiendaRepository.save(stockPack);
        }

        return await this.productosLocalRepository.findOne({
          where: { idlocal: productData.idlocal, idproducto: idChildProduct },
        });
      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (error) {
      console.error(error);
    }
  }
}
