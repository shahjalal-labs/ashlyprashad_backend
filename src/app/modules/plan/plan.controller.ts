import {planServices} from './plan.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";

const createPlan = catchAsync (async (req, res) => {
  await planServices.createPlan(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The plan has been created successfully"
  });
})

const getAllPlans = catchAsync(async (req, res) => {
  const result = await planServices.getAllPlans();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All plans has been retrived successfully",
    data: result,
  });
})

const getPlanById = catchAsync(async (req, res) => {
  const result = await planServices.getPlanById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "plan has been retrived successfully",
    data: result,
  });
})

const updatePlan = catchAsync(async (req, res) => {
  await planServices.updatePlan(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "plan has been updated successfully"
  });
})

const deletePlan = catchAsync(async (req, res) => {
  await planServices.deletePlan(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "plan has been deleted successfully",
  });
})

export const planControllers = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
}
  