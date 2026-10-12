import { Plan } from "@prisma/client";
import prisma from "../../../shared/prisma";
import stripe from "../../../config/stripe";

const createPlan = async (payload: Plan) => {
  const {
    planName,
    price,
    ideal,
    interval,
    intervalCount,
    accessBooks,
    features,
  } = payload;

  // Step 1: Create a product
  const product = await stripe.products.create({
    name: planName,
  });

  // Step 2: Create a price for the product
  const amount = await stripe.prices.create({
    unit_amount: price * 100,
    currency: "usd",
    product: product.id,
    recurring: {
      interval: interval,
      interval_count: intervalCount,
    },
  });

  await prisma.plan.create({
    data: {
      planName,
      priceId: amount.id,
      productId: product.id,
      ideal,
      price,
      interval,
      intervalCount,
      accessBooks,
      features,
    },
  });

  return;
};

const getAllPlans = async () => {
  const results = await prisma.plan.findMany({
    orderBy: {
      price: "asc",
    },
  });
  return results;
};

const getPlanById = async (id: string) => {
  const result = await prisma.plan.findUnique({ where: { id } });
  return result;
};

const updatePlan = async (id: string, data: any) => {
  await prisma.plan.update({ where: { id }, data });
  return;
};

const deletePlan = async (id: string) => {
  await prisma.plan.delete({ where: { id } });
  return;
};

export const planServices = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
};
