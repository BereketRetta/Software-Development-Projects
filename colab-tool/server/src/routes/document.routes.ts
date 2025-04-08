// src/routes/document.routes.ts
import { Router } from 'express';
import { 
  createDocument, 
  getUserDocuments, 
  getDocument, 
  updateDocumentTitle,
  addCollaborator,
  removeCollaborator,
  deleteDocument
} from '../controllers/document.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all document routes
router.use(authMiddleware);

// Document routes
router.post('/', createDocument);
router.get('/', getUserDocuments);
router.get('/:id', getDocument);
router.put('/:id/title', updateDocumentTitle);
router.post('/:id/collaborators', addCollaborator);
router.delete('/:id/collaborators/:collaboratorId', removeCollaborator);
router.delete('/:id', deleteDocument);

export default router;