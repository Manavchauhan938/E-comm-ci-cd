import { Router } from 'express';
import * as addressController from '../controllers/address.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createAddressSchema } from '../validators/order.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', addressController.listAddresses);
router.post('/', validate(createAddressSchema), addressController.createAddress);
router.put('/:id', validate(createAddressSchema.partial()), addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);

export default router;
