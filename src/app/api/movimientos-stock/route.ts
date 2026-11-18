import { fromPaginated } from "@/lib/api/response";
import { withApi } from "@/lib/api/with-api";
import * as service from "@/lib/services/productos.service";

/** GET /api/movimientos-stock — RF-P6. */
export const GET = withApi(async ({ user, query }) =>
  fromPaginated(await service.movimientosGenerales(user, query)),
);
