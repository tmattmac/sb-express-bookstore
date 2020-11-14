process.env.NODE_ENV = 'test';

const app = require('./app');
const request = require('supertest');
const db = require('./db');
const Book = require('./models/book');

beforeEach(async () => {
    const data = {
        "isbn": "0691161518",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Matthew Lane",
        "language": "english",
        "pages": 264,
        "publisher": "Princeton University Press",
        "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
        "year": 2017
    };
    await Book.create(data);
});

afterEach(async () => {
    await db.query(`DELETE FROM books`);
});

afterAll(() => {
    db.end();
});

describe('GET /books', () => {
    test('returns array of books', async () => {
        const res = await request(app).get('/books');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            books: [expect.objectContaining({
                isbn: "0691161518",
                title: "Power-Up: Unlocking the Hidden Mathematics in Video Games"
            })]
        });
    });
});

describe('GET /books/:isbn', () => {

    test('returns details for book', async () => {
        const res = await request(app).get('/books/0691161518');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            book: expect.objectContaining({
                isbn: "0691161518",
                title: "Power-Up: Unlocking the Hidden Mathematics in Video Games"
            })
        });
    });

    test('return 404 for invalid isbn', async () => {
        const res = await request(app).get('/books/0000000000');
        expect(res.statusCode).toBe(404);
    });
});

describe('POST /books', () => {

    test('post valid book', async () => {
        const data = {
            "isbn": "1234567890",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Test Book Title",
            "year": 2017
        };
        const res = await request(app).post('/books').send(data);
        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({
            book: expect.objectContaining({
                isbn: "1234567890",
                title: "Test Book Title"
            })
        });
    });

    test('disallow duplicate isbn', async () => {
        const data = {
            "isbn": "0691161518",
            "amazon_url": "http://a.co/eobPtX2",
            "author": "Matthew Lane",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
            "year": 2017
        };
        const res = await request(app).post('/books').send(data);
        expect(res.statusCode).not.toBe(201);

        const books = await Book.findAll();
        expect(books).toHaveLength(1);
    });

    test('disallow missing data', async () => {
        const data = {
            "isbn": "1234567890",
            "amazon_url": "http://a.co/eobPtX2",
            "language": "english",
            "pages": 264,
            "publisher": "Princeton University Press",
            "title": "Test Book Title",
            "year": 2017
        };
        const res = await request(app).post('/books').send(data);
        expect(res.statusCode).toBe(400);

        const books = await Book.findAll();
        expect(books).toHaveLength(1);
    });
});

describe('PUT /books/:isbn', () => {

    test('update book with valid data', async () => {
        const data = {
            "isbn": "0691161518",
            "amazon_url": "http://a.co/xxxyyy",
            "author": "James Dean",
            "language": "english",
            "pages": 500,
            "publisher": "APress",
            "title": "Test Book Title",
            "year": 2020
        };
        const res = await request(app).put('/books/0691161518').send(data);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            book: data
        });
    });

    test('return 404 for invalid isbn', async () => {
        const data = {
            "isbn": "0000000000",
            "amazon_url": "http://a.co/xxxyyy",
            "author": "James Dean",
            "language": "english",
            "pages": 500,
            "publisher": "APress",
            "title": "Test Book Title",
            "year": 2020
        };
        const res = await request(app).put('/books/0000000000').send(data);
        expect(res.statusCode).toBe(404);
    });

    test('disallow missing data', async () => {
        const data = {
            "isbn": "0691161518",
            "amazon_url": "http://a.co/xxxyyy",
            "author": "James Dean",
            "language": "english",
            "pages": 500,
            "title": "Test Book Title",
            "year": 2020
        };
        const res = await request(app).put('/books/0691161518').send(data);
        expect(res.statusCode).not.toBe(200);

        const book = await Book.findOne('0691161518');
        expect(book).not.toMatchObject(data);
    });
});

describe('DELETE /books/:isbn', () => {

    test('delete book', async () => {
        const res = await request(app).delete('/books/0691161518');
        expect(res.statusCode).toBe(200);
        
        const books = await Book.findAll();
        expect(books).toHaveLength(0);
    });

    test('deleting book with invalid isbn returns 404', async () => {
        const res = await request(app).delete('/books/0000000000');
        expect(res.statusCode).toBe(404);

        const books = await Book.findAll();
        expect(books).toHaveLength(1);
    });

});