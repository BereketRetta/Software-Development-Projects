// src/utils/ot.ts

/**
 * TextOperation interface for document operations
 */
export interface TextOperation {
    type: 'insert' | 'delete';
    position: number;
    text?: string;
    length?: number;
    userId: string;
    documentId: string;
    timestamp: number;
    version: number;
  }
  
  /**
   * Apply an insert operation to a document
   * @param content - The current document content
   * @param operation - The insert operation to apply
   * @returns The new document content after applying the operation
   */
  export const applyInsert = (content: string, operation: TextOperation): string => {
    if (operation.type !== 'insert' || !operation.text) {
      throw new Error('Invalid insert operation');
    }
    
    // Ensure position is within bounds
    const position = Math.min(operation.position, content.length);
    
    // Insert text at position
    return content.slice(0, position) + operation.text + content.slice(position);
  };
  
  /**
   * Apply a delete operation to a document
   * @param content - The current document content
   * @param operation - The delete operation to apply
   * @returns The new document content after applying the operation
   */
  export const applyDelete = (content: string, operation: TextOperation): string => {
    if (operation.type !== 'delete' || !operation.length) {
      throw new Error('Invalid delete operation');
    }
    
    // Ensure position and length are within bounds
    const position = Math.min(operation.position, content.length);
    const length = Math.min(operation.length, content.length - position);
    
    // Delete text at position
    return content.slice(0, position) + content.slice(position + length);
  };
  
  /**
   * Apply an operation to a document
   * @param content - The current document content
   * @param operation - The operation to apply
   * @returns The new document content after applying the operation
   */
  export const applyOperation = (content: string, operation: TextOperation): string => {
    switch (operation.type) {
      case 'insert':
        return applyInsert(content, operation);
      case 'delete':
        return applyDelete(content, operation);
      default:
        throw new Error('Unknown operation type');
    }
  };
  
  /**
   * Transform an operation against another operation
   * This is a simplified implementation of operational transformation
   * In a real OT system, this would be more complex
   * 
   * @param operation - The operation to transform
   * @param against - The operation to transform against
   * @returns The transformed operation
   */
  export const transformOperation = (
    operation: TextOperation, 
    against: TextOperation
  ): TextOperation => {
    // Skip if operations are from the same user or different documents
    if (operation.userId === against.userId || operation.documentId !== against.documentId) {
      return operation;
    }
    
    // If our operation happened after the other operation
    if (operation.timestamp > against.timestamp) {
      // Transform based on operation types
      if (against.type === 'insert' && against.text) {
        // If other operation inserted text before our position, shift our position
        if (against.position <= operation.position) {
          return {
            ...operation,
            position: operation.position + against.text.length
          };
        }
      } else if (against.type === 'delete' && against.length) {
        // If other operation deleted text before our position, shift our position
        if (against.position < operation.position) {
          const overlap = Math.max(0, against.position + against.length - operation.position);
          return {
            ...operation,
            position: operation.position - (against.length - overlap)
          };
        }
      }
    }
    
    // No transformation needed
    return operation;
  };