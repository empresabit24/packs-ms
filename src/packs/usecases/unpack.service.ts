import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  movimientos,
  productos,
  productoslocal,
  stockproductostienda,
} from '../../infraestructure/microservice/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { packs } from '../entities/pack.entity';
import { Repository } from 'typeorm';
import { productospack } from '../entities/productospack.entity';
import { UnpackDto } from '../dto/unpack.dto';

@Injectable()
export class UnpackService {
  private readonly logger = new Logger('UnpackService');
  idProducto: number;
  idPack: number;

  constructor(
    @InjectRepository(productos)
    private productosRepository: Repository<productos>,

    @InjectRepository(packs)
    private readonly packsRepository: Repository<packs>,

    @InjectRepository(productoslocal)
    private productosLocalRepository: Repository<productoslocal>,

    @InjectRepository(stockproductostienda)
    private stockProductosTiendaRepository: Repository<stockproductostienda>,

    @InjectRepository(movimientos)
    private readonly movimientosRepository: Repository<movimientos>,

    @InjectRepository(productospack)
    private readonly productosPackRepository: Repository<productospack>,
  ) {}

  async unpack(unpackDto: UnpackDto) {
    try {
      // VALIDAMOS SI TENEMOS idProducto o idPack EN EL DTO
      if (unpackDto.idPack) {
        // Si existe idPack en el DTO, obtenemos idproducto del pack
        const pack = await this.packsRepository
          .createQueryBuilder('pack')
          .select(['pack.idpack', 'pack.idproducto'])
          .where('pack.idpack = :idpack', { idpack: unpackDto.idPack })
          .getOne();

        if (!pack) {
          throw new NotFoundException('Pack no encontrado.');
        }

        this.idProducto = Number(pack.idproducto);
        this.idPack = unpackDto.idPack;
      } else if (unpackDto.idProducto) {
        // Si existe idProducto en el DTO, obtenemos idPack
        this.idProducto = unpackDto.idProducto;
        const pack = await this.packsRepository
          .createQueryBuilder('pack')
          .select(['pack.idpack', 'pack.idproducto'])
          .where('pack.idproducto = :idproducto', {
            idproducto: this.idProducto,
          })
          .getOne();
        this.idPack = Number(pack.idpack);
      } else {
        throw new NotFoundException(
          'Se requiere idPack o idProducto en el payload',
        );
      }

      // OBTENEMOS EL NOMBRE DEL PACK:
      const packName = await this.getNameProducto(this.idProducto);

      this.logger.log(`SE OBTUVO EL NOMBRE DEL PACK ${packName}`);

      /*// Cambiar el estado del idproducto a inactivo
            await this.productosRepository
              .createQueryBuilder()
              .update(productos)
              .set({
                idestado: 4,
              })
              .where('idproducto = :idproducto', { idproducto: idproducto })
              .execute();*/

      //DISMINUIMOS EL STOCK DEL PACK A DESARMAR
      const { idproductolocal } = await this.productosLocalRepository
        .createQueryBuilder('productoslocal')
        .select(['productoslocal.idproductolocal'])
        .where('productoslocal.idproducto = :idproducto', {
          idproducto: this.idProducto,
        })
        .andWhere('productoslocal.idlocal = :idlocal', {
          idlocal: unpackDto.idLocal,
        })
        .getOne();

      const packToUpdate = await this.stockProductosTiendaRepository
        .createQueryBuilder('stockproductostienda')
        .where('stockproductostienda.idproductolocal = :idproductolocal', {
          idproductolocal,
        })
        .getOne();

      this.logger.log(`OBTENEMOS STOCK ACTUAL DEL PACK ${packToUpdate.stock}`);

      // VALIDAR QUE LA CANTIDAD A DESARMAR SEA MENOR O IGUAL AL STOCK DEL PACK
      if (unpackDto.stockToUnpack > packToUpdate.stock) {
        throw new BadRequestException(
          `Se quieren desarmar ${unpackDto.stockToUnpack} unidades de ${packName}
          , pero solo existen ${packToUpdate.stock} unidades.`,
        );
      }

      // ACTUALIZAMOS EL STOCK DEL PACK
      packToUpdate.stock =
        Number(packToUpdate.stock) - Number(unpackDto.stockToUnpack);
      packToUpdate.stock_unidades = Number(packToUpdate.stock);
      packToUpdate.stock_presentacion = Number(packToUpdate.stock);

      await this.stockProductosTiendaRepository.save(packToUpdate);

      this.logger.log(`GUARDAMOS EL NUEVO STOCK DEL PACK ${packToUpdate.stock}`);

      // AGREGAR A MOVIMIENTOS EL NUEVO STOCK DEL PACK
      await this.movimientosRepository
        .createQueryBuilder()
        .insert()
        .into(movimientos)
        .values([
          {
            idtipomovimiento: 17,
            idstockproductotienda: packToUpdate.idstockproductotienda,
            salida: unpackDto.stockToUnpack,
            entrada: null,
            idusuario: 1,
            stockfinal: packToUpdate.stock,
            detalle: `{"tipo": "UNPACK", "UNPACK": "${packName}"}`,
          },
        ])
        .execute();

      this.logger.log(`AGREGAMOS A MOVIMIENTOS EL AJUSTE DE STOCK`);

      // DEVOLUCIÓN DE PRODUCTOS
      const productsInPack = await this.productosPackRepository
        .createQueryBuilder('productospack')
        .select(['productospack.idproducto', 'productospack.productquantity'])
        .where('productospack.idpack = :idpack', { idpack: this.idPack })
        .getMany();

      console.log('Esto es productsInPack:', productsInPack);

      for (const producto of productsInPack) {
        const productoPackInfo = await this.productosLocalRepository
          .createQueryBuilder('productolocal')
          .where('productolocal.idproducto = :idproducto', {
            idproducto: producto.idproducto,
          })
          .andWhere('productolocal.idlocal = :idlocal', {
            idlocal: unpackDto.idLocal,
          })
          .getOne();
        console.log(productoPackInfo);

        await this.stockProductosTiendaRepository
          .createQueryBuilder()
          .update(stockproductostienda)
          .set({
            stock: () => `stock + :stockQuantity`,
            stock_unidades: () => `stock_unidades + :stockQuantity`,
            stock_presentacion: () => `stock_presentacion + :stockQuantity`,
          })
          .where('idproductolocal = :idproductolocal', {
            idproductolocal: productoPackInfo.idproductolocal,
          })
          .setParameter(
            'stockQuantity',
            Number(unpackDto.stockToUnpack * producto.productquantity),
          )
          .execute();
        this.logger.log(
          `STOCK DE PRODUCTO CON ID ${producto.idproducto} LISTO `,
        );

        const updateProductoPackInfo = await this.stockProductosTiendaRepository
          .createQueryBuilder('stockproductostienda')
          .where('stockproductostienda.idproductolocal = :idproductolocal', {
            idproducto: producto.idproducto,
          })
          .where('idproductolocal = :idproductolocal', {
            idproductolocal: productoPackInfo.idproductolocal,
          })
          .getOne();
        console.log(updateProductoPackInfo);

        // AGREGAR MOVIMIENTO
        try {
          this.logger.log('AGREGANDO MOVIMIENTOS');
          console.log(producto);
          const sumaStockFinal =
            Number(unpackDto.stockToUnpack * producto.productquantity) +
            Number(updateProductoPackInfo.stock);

          await this.movimientosRepository
            .createQueryBuilder()
            .insert()
            .into(movimientos)
            .values([
              {
                idtipomovimiento: 17,
                idstockproductotienda:
                  updateProductoPackInfo.idstockproductotienda,
                salida: null,
                entrada: unpackDto.stockToUnpack * producto.productquantity,
                idusuario: 1,
                stockfinal: sumaStockFinal,
                detalle: `{"tipo": "UNPACK", "UNPACK": "${packName}"}`,
              },
            ])
            .execute();
          this.logger.log(
            `PRODUCTO CON ID ${producto.idproducto} AGREGADO A MOVIMIENTOS `,
          );
        } catch (error) {
          this.logger.error('Error al desarmar el pack:', error.message);
          throw error;
        }
      }

      // MENSAJE EXITOSO
      return {
        status: 'success',
        message: `Se desarmaron ${unpackDto.stockToUnpack} unidades del pack '${packName}'`,
      };
    } catch (error) {
      this.logger.error('Error al desarmar el pack:', error.message);
      throw error;
    }
  }

  async getNameProducto(idProducto: number) {
    const { producto } = await this.productosRepository
      .createQueryBuilder('productos')
      .select(['productos.producto'])
      .where('productos.idproducto = :idproducto', {
        idproducto: idProducto,
      })
      .getOne();

    return producto;
  }
}
