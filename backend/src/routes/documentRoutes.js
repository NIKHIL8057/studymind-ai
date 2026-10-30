import { Router } from 'express';
import * as c from '../controllers/documentController.js';
import { uploadPdf } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { renameSchema } from '../validators/index.js';

const r = Router();
r.post('/', uploadPdf, c.upload);
r.get('/', c.list);
r.get('/:id', c.getOne);
r.get('/:id/file', c.file);
r.patch('/:id', validate(renameSchema), c.rename);
r.delete('/:id', c.remove);
export default r;
