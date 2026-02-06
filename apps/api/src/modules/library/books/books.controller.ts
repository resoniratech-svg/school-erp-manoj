/**
 * Books Sub-module Controller
 */
import { libraryController } from '../library.controller';

export const booksController = {
    create: libraryController.createBook,
    get: libraryController.getBook,
    list: libraryController.listBooks,
    update: libraryController.updateBook,
    delete: libraryController.deleteBook,
};
