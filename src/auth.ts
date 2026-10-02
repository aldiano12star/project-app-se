/**
 * Auth.js v5 Configuration
 *
 * Implements Google OAuth authentication with:
 * - Email whitelist verification via database
 * - Automatic OPERATOR role assignment for INITIAL_OPERATOR_EMAIL
 * - JWT and Session callbacks with custom user properties
 * - Type augmentation for TypeScript support
 */

import NextAuth, { type DefaultSession } from "next-auth";
import "next-auth/jwt"; // Wajib di-import agar augmentasi modul di bawah dikenali TypeScript
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { Role, MemberStatus, Division, ClassGrade } from "@prisma/client";

// Augmentasi tipe Session dan User pada next-auth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      classGrade: ClassGrade | null;
      mainDivision: Division | null;
      status: MemberStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    classGrade?: ClassGrade;
    mainDivision?: Division;
    status?: MemberStatus;
  }
}

// Augmentasi tipe token JWT pada next-auth/jwt
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    classGrade: ClassGrade | null;
    mainDivision: Division | null;
    status: MemberStatus;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      const isOperator =
        process.env.INITIAL_OPERATOR_EMAIL &&
        email === process.env.INITIAL_OPERATOR_EMAIL.toLowerCase();

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Buat akun baru otomatis dengan role ANGGOTA atau OPERATOR
          await prisma.user.create({
            data: {
              email,
              name: user.name || "Anggota Saba ExploIT",
              image: user.image,
              role: isOperator ? Role.OPERATOR : Role.ANGGOTA,
              mainDivision: Division.PROGRAMMING,
              classGrade: ClassGrade.KELAS_10,
              status: MemberStatus.ACTIVE,
            },
          });
        } else {
          // Sinkronisasi jika foto Google berganti atau operator perlu dipastikan aktif
          const updates: Record<string, unknown> = {};
          if (user.image && user.image !== existingUser.image) {
            updates.image = user.image;
          }
          if (isOperator && existingUser.role !== Role.OPERATOR) {
            updates.role = Role.OPERATOR;
            updates.status = MemberStatus.ACTIVE;
          }

          if (Object.keys(updates).length > 0) {
            await prisma.user.update({
              where: { email },
              data: updates,
            });
          }
        }

        return true;
      } catch (error) {
        console.error("[Auth] SignIn error:", error);
        return false;
      }
    },

    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.classGrade = dbUser.classGrade;
          token.mainDivision = dbUser.mainDivision;
          token.status = dbUser.status;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.classGrade = token.classGrade as ClassGrade;
        session.user.mainDivision = token.mainDivision as Division;
        session.user.status = token.status as MemberStatus;
      }
      return session;
    },
  },
});