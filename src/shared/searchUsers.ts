import { Prisma } from "@prisma/client";

export const searchUsers = (
  search: string | null
): Prisma.UserWhereInput | undefined => {
  if (!search || search.trim() === "") {
    return undefined;
  }

  const searchConditions: Prisma.UserWhereInput[] = [
    { fullName: { contains: search, mode: "insensitive" } },
    { email: { contains: search, mode: "insensitive" } },
  ];

  return { OR: searchConditions };
};
