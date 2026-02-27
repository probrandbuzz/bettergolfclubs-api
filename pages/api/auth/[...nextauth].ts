import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'GolfRoots Admin',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data: admin, error } = await supabaseAdmin
          .from('admin_users')
          .select('id, email, name, password_hash, role, active')
          .eq('email', credentials.email.toLowerCase().trim())
          .single();

        if (error || !admin || !admin.active) return null;

        const valid = await bcrypt.compare(credentials.password, admin.password_hash);
        if (!valid) return null;

        // Update last_login
        await supabaseAdmin
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', admin.id);

        return {
          id:    admin.id,
          email: admin.email,
          name:  admin.name,
          role:  admin.role,
        };
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }, // 8-hour sessions

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id   = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },

  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
