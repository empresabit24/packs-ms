import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { packs } from '../entities/pack.entity';
import { Repository } from 'typeorm';
import {
  movimientos,
  productos,
  productoslocal,
  stockproductostienda,
} from '../../infraestructure/microservice/entities';

@Injectable()
export class AddStockService {
  private readonly logger = new Logger('AddStockService');

  constructor(
    @InjectRepository(productos)
    private productosRepository: Repository<productos>,

    @InjectRepository(packs)
    private readonly packsRepository: Repository<packs>,

    @InjectRepository(movimientos)
    private readonly movimientosRepository: Repository<movimientos>,

    @InjectRepository(productoslocal)
    private productosLocalRepository: Repository<productoslocal>,

    @InjectRepository(stockproductostienda)
    private stockProductosTiendaRepository: Repository<stockproductostienda>,
  ) {}

  async addStock(idProducto: number, idLocal: number, stockToAdd: number) {
    //PRIMERO OBTENEMOS EL NOMBRE DEL PACK
    const { producto } = await this.productosRepository
      .createQueryBuilder('productos')
      .select(['productos.producto'])
      .where('productos.idproducto = :idproducto', {
        idproducto: idProducto,
      })
      .getOne();

    try {
      // AHORA NOS ASEGURAMOS QUE idproducto CORRESPONDA A LA TABLA idproductolocal
      const productoLocalPack = await this.productosLocalRepository
        .createQueryBuilder('productoslocal')
        .select(['productoslocal'])
        .where('productoslocal.idproducto = :idproducto', {
          idproducto: idProducto,
        })
        .andWhere('productoslocal.idlocal = :idlocal', {
          idlocal: idLocal,
        })
        .getOne();

      // LUEGO BUSCAMOS EL PACK USANDO idproducto
      const { idpack } = await this.packsRepository
        .createQueryBuilder('pack')
        .select(['pack'])
        .where('pack.idproducto = :idproducto', {
          idproducto: idProducto,
        })
        .getOne();

      if (!idpack || !productoLocalPack) {
        throw new NotFoundException('El pack no fue encontrado.');
      }

      if (Number(productoLocalPack.idestado) === 4)
        throw new BadRequestException('El pack está inactivo.');

      // UNA VEZ QUE SE TIENE EL PACK, SE DEBEN ENCONTRAR LOS PRODUCTOS BASE
      const { productos } = await this.packsRepository
        .createQueryBuilder('pack')
        .innerJoinAndSelect('pack.productos', 'productospack')
        .leftJoinAndSelect('productospack.producto', 'productos')
        .select([
          'pack.idpack',
          'pack.idproducto',
          'productospack',
          'productos',
        ])
        .where('pack.idpack = :idpack', { idpack: idpack })
        .getOne();

      // TRAS TENER LOS PRODUCTOS BASE SE DEBE CONFIRMAR SI EL LOCAL TIENE STOCK SUFICIENTE DEL ESTOS
      for (const producto of productos) {
        const productName = producto.producto.producto;
        const productId = producto.producto.idproducto;
        const estadoProducto = producto.producto.idestado;
        const productQuantityInPack = producto.productquantity;

        if (Number(estadoProducto) === 4) {
          throw new BadRequestException(
            `El producto ${productName} está INACTIVO.`,
          );
        }
        const infoProducto = await this.productosLocalRepository
          .createQueryBuilder('productoslocal')
          .innerJoinAndSelect(
            'productoslocal.stockPacksLocal',
            'stockproductos',
          )
          .select(['productoslocal', 'stockproductos'])
          .where('productoslocal.idproducto = :idproducto', {
            idproducto: productId,
          })
          .andWhere('productoslocal.idlocal = :idlocal', { idlocal: idLocal })
          .getOne();

        if (!infoProducto)
          throw new NotFoundException(
            `El producto "${productName}" con ID ${productId} no existe en este local. Por favor comunícate con Bit24`,
          );

        // DETERMINAR SI LOS PRODUCTOS TIENE STOCK SUFICIENTE PARA AUMENTAR EL STOCK DEL PACK
        const stockProducto = Number(infoProducto.stockPacksLocal[0].stock);

        if (stockProducto < stockToAdd * productQuantityInPack) {
          throw new BadRequestException(
            `El producto "${productName}" tiene ${stockProducto} unidades, esto no es suficiente para armar ${stockToAdd} packs.`,
          );
        }
      }

      //TRAS COMPROBAR QUE LOS PRODUCTOS BASE SI TIENEN STOCK SUFICIENTE SE PROCEDE A DESCONTARLO
      for (const producto of productos) {
        // Se obtiene el idproductolocal de la tabla productoslocal
        const productoToDiscount = await this.productosLocalRepository
          .createQueryBuilder('productoslocal')
          .select(['productoslocal'])
          .where('productoslocal.idproducto = :idproducto', {
            idproducto: producto.idproducto,
          })
          .andWhere('productoslocal.idlocal = :idlocal', {
            idlocal: idLocal,
          })
          .getOne();

        // Se obtiene el stock actual para luego actualizarlo
        const stockProductoToDiscount =
          await this.stockProductosTiendaRepository.findOne({
            where: {
              idproductolocal: productoToDiscount.idproductolocal,
            },
          });

        stockProductoToDiscount.stock =
          Number(stockProductoToDiscount.stock) + Number(stockToAdd);
        stockProductoToDiscount.stock_unidades =
          Number(stockProductoToDiscount.stock_unidades) + Number(stockToAdd);
        stockProductoToDiscount.stock_presentacion =
          Number(stockProductoToDiscount.stock_presentacion) +
          Number(stockToAdd);

        await this.stockProductosTiendaRepository.save(stockProductoToDiscount);

        //   AGREGAR A MOVIMIENTOS LA DISMINUCION DE LOS PRODUCTOS BASE
        const movimiento = this.movimientosRepository.create({
          idtipomovimiento: 16,
          idstockproductotienda: stockProductoToDiscount.idstockproductotienda,
          salida: stockToAdd * producto.productquantity,
          entrada: null,
          idusuario: 1,
          stockfinal: stockProductoToDiscount.stock,
          detalle: `{"tipo": "AUMENTAR STOCK A PACK", "PACK": "${producto}"}`,
        });

        await this.movimientosRepository.save(movimiento);
      }

      //AUMENTAR EL STOCK DEL PACK
      const packToUpdate = await this.stockProductosTiendaRepository.findOne({
        where: {
          idproductolocal: productoLocalPack.idproductolocal,
        },
      });

      packToUpdate.stock = Number(packToUpdate.stock) + Number(stockToAdd);
      packToUpdate.stock_unidades =
        Number(packToUpdate.stock_unidades) + Number(stockToAdd);
      packToUpdate.stock_presentacion =
        Number(packToUpdate.stock_presentacion) + Number(stockToAdd);

      try {
        await this.stockProductosTiendaRepository.save(packToUpdate);
      } catch (error) {
        throw new BadRequestException(
          `Se descontaron los productos, pero no pudo crearse el pack. Comunícate con Bit24 mostrando esta información: idproductolocal ${packToUpdate}`,
        );
      }

      //AGREGAR AUMENTO DEL STOCK DEL PACK A MOVIMIENTOS
      const movimiento = this.movimientosRepository.create({
        idtipomovimiento: 16,
        idstockproductotienda: packToUpdate.idstockproductotienda,
        salida: null,
        entrada: stockToAdd,
        idusuario: 1,
        stockfinal: packToUpdate.stock,
        detalle: `{"tipo": "AUMENTAR STOCK A PACK", "PACK": "${producto}"}`,
      });

      await this.movimientosRepository.save(movimiento);

      // MENSAJE EXITOSO
      return {
        status: 'success',
        message: `Se agregaron ${stockToAdd} unidades al PACK '${producto}'`,
      };
    } catch (error) {
      this.logger.error('Error al agregar stock:', error.message);
      throw error;
    }
  }
}
