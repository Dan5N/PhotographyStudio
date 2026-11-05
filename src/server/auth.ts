import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "@/server/db";
import { verifyPassword } from "@/server/passwords";

interface IUser {
  name?: string;
  email?: string | null;
  id?: string;
  image?: string;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: User & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends IUser {
    role: string;
  }
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, token, user }) => {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
    jwt({ token, user, account, profile, isNewUser }) {
      // if (account) {
      //   token.accessToken = account.access_token;
      // }
      if (user) {
        token.role = user.role;
        token.id = token.sub;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  jwt: {
    maxAge: 60 * 60 * 12,
  },
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "name", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials.password) return null;
        const user = await db.user.findFirst({
          where: { active: true, OR: [{ username: credentials.name }, { email: credentials.name }] },
        });
        if (!user || !(await verifyPassword(credentials.password, user.password))) return null;
        return { id: user.id, name: user.username, email: user.email, role: user.role };
      },
    }),
  ],
};

export const getServerAuthSession = () => getServerSession(authOptions);
