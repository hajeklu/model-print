import type { FastifyPluginAsync } from "fastify";
import { createOrderBodySchema } from "../schemas/order.js";
import {
  createOrderFromUpload,
  getOrderById,
  OrderServiceError,
} from "../services/orderService.js";

export const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.post("/orders", async (request, reply) => {
    const parsed = createOrderBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(422).send({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: parsed.error.flatten(),
      });
    }

    try {
      const { orderId } = await createOrderFromUpload(parsed.data);
      return reply.code(201).send({ orderId });
    } catch (err) {
      if (err instanceof OrderServiceError) {
        return reply.code(err.statusCode).send({
          error: err.message,
          code: err.code,
        });
      }
      request.log.error(err);
      return reply.code(500).send({ error: "Order creation failed", code: "ORDER_FAILED" });
    }
  });

  app.get("/orders/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await getOrderById(id);
    if (!order) {
      return reply.code(404).send({ error: "Order not found", code: "NOT_FOUND" });
    }
    return reply.send(order);
  });
};
