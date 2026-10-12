import axios from "axios";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { Reading, SaveBook } from "@prisma/client";
import { client } from "../../../config/openai";
import { startOfDay } from "date-fns";
import { sendNotification } from "../notification/notification.service";

export const generateToken = async () => {
  let apiAccessToken = null;
  try {
    const response = await axios.post(
      "https://api.magicblox.com/v1/authentication",
      {
        strategy: "local",
        appId: config.book.appId,
        secretKey: config.book.secretKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    apiAccessToken = response?.data.accessToken || null;
  } catch (error: any) {
    console.error("Failed to fetch apiAccessToken:", error.message);
  }

  return { apiAccessToken };
};

const getBooksByAuthor = async (author: string, userId: string) => {
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: { readLevel: true },
  });

  if (!userInfo) throw new ApiError(404, "User not found.");

  const { apiAccessToken } = await generateToken();
  if (!apiAccessToken) {
    throw new ApiError(400, "No access token received.");
  }
  try {
    const response = await axios.get(
      `https://api.magicblox.com/v1/book?author=${author}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiAccessToken}`,
        },
      }
    );
    // console.log(response.data);
    let books = response.data;

    if (userInfo.readLevel) {
      books = books.filter((book: any) =>
        book.readingLevel
          ?.toLowerCase()
          .includes(userInfo.readLevel!.toLowerCase())
      );
    }
    return books;
  } catch (error: any) {
    console.error("Failed to fetch book by author:", error.message);
  }
};

const getBooksByTitle = async (query: any) => {
  const { title, level, rating } = query;
  console.log(query);
  const { apiAccessToken } = await generateToken();
  if (!apiAccessToken) {
    throw new ApiError(400, "No access token received.");
  }
  try {
    const response = await axios.get(
      `https://api.magicblox.com/v1/book?title=${title}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiAccessToken}`,
        },
      }
    );
    let books = response.data;

    if (level) {
      books = books.filter((book: any) =>
        book.readingLevel?.toLowerCase().includes(level.toLowerCase())
      );
    }

    if (rating) {
      books = books.filter(
        (book: any) =>
          book.ratingAverage && book.ratingAverage >= Number(rating)
      );
    }
    return books;
  } catch (error: any) {
    console.error("Failed to fetch book by author:", error.message);
  }
};

const getBookByNid = async (nid: string) => {
  const { apiAccessToken } = await generateToken();
  if (!apiAccessToken) {
    throw new ApiError(400, "No access token received.");
  }
  try {
    const response = await axios.get(
      `https://api.magicblox.com/v1/book?nid=${nid}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiAccessToken}`,
        },
      }
    );
    return response.data[0];
  } catch (error: any) {
    console.error("Failed to fetch book by author:", error.message);
  }
};

const startReading = async (payload: Reading, userId: string, nid: number) => {
  const today = startOfDay(new Date());
  const currentTime = new Date();

  await prisma.reading.upsert({
    where: {
      userId_nid: { userId, nid },
    },
    update: {
      ...payload,
      readingTime: {
        increment: payload.readingTime,
      },
    },
    create: {
      ...payload,
      userId,
      nid,
    },
  });

  await prisma.progress.upsert({
    where: {
      userId_progressDate: {
        userId,
        progressDate: today,
      },
    },
    update: {
      endTime: currentTime,
    },
    create: {
      userId,
      progressDate: today,
      startTime: currentTime,
      endTime: currentTime,
    },
  });

  const isSave = await prisma.saveBook.findUnique({
    where: {
      userId_nid: { userId, nid },
    },
  });

  if (isSave) {
    await prisma.saveBook.delete({
      where: {
        userId_nid: {
          userId,
          nid,
        },
      },
    });
  }
  return;
};

const readingProgress = async (userId: string) => {
  const readingBooks = await prisma.reading.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      nid: true,
      totalPages: true,
      currentPage: true,
      coverImage: true,
      title: true,
      readCount: true,
    },
  });

  const filteredBooks = readingBooks
    .filter((book) => book.totalPages !== book.currentPage)
    .map((book) => {
      const progress =
        book.totalPages && book.totalPages > 0
          ? Math.floor((book.currentPage / book.totalPages) * 100)
          : 0;

      return {
        ...book,
        progress,
      };
    });

  return filteredBooks;
};

const readingCompleted = async (userId: string) => {
  const readingBooks = await prisma.reading.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      nid: true,
      totalPages: true,
      currentPage: true,
      title: true,
      coverImage: true,
    },
  });

  const filteredBooks = readingBooks.filter(
    (book) => book.totalPages === book.currentPage
  );

  return filteredBooks;
};

const saveBook = async (payload: SaveBook, userId: string, nid: number) => {
  const isExist = await prisma.saveBook.findUnique({
    where: {
      userId_nid: { userId, nid },
    },
  });
  if (isExist) {
    throw new ApiError(400, "This book already saved");
  }
  await prisma.saveBook.create({
    data: {
      ...payload,
      userId,
      nid,
    },
  });

  await sendNotification(
    userId,
    "Book Save",
    `${payload.title} has been saved successfully`
  );
  return;
};

const savedMyBooks = async (userId: string) => {
  const savedBooks = await prisma.saveBook.findMany({
    where: {
      userId,
    },
  });
  return savedBooks;
};

const generateQuizz = async (url: string, bookId: number) => {
  const messages: any[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Look at this image and create 1–2 multiple-choice quiz questions. 
          Each quiz must include:
          - question
          - 4 options (A–D)
          - the correct answer
          Return in JSON format like:
          {
            "quiz": [
              {"question": "...", "bookId" : ${bookId} "options": ["A","B","C","D"], "answer": "A"}
            ]
          }`,
        },
        { type: "image_url", image_url: { url } },
      ],
    },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: { type: "json_object" }, // ensures valid JSON
  });

  // Extract & parse quiz JSON
  const content = response.choices[0].message?.content || "{}";
  const parsed = JSON.parse(content);

  return parsed.quiz || [];
};

export const bookServices = {
  getBooksByAuthor,
  getBooksByTitle,
  getBookByNid,
  startReading,
  readingProgress,
  readingCompleted,
  saveBook,
  savedMyBooks,
  generateQuizz,
};
