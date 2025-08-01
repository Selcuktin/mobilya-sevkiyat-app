import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Mock user database - gerçek uygulamada Prisma/database kullanılacak
const users = [
  {
    id: '1',
    email: 'demo@example.com',
    password: 'secret123', // Basit şifre test için
    name: 'Demo User'
  },
  {
    id: '2',
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'Admin User'
  }
]

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('Login attempt:', credentials)

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        const user = users.find(user => user.email === credentials.email)

        if (!user) {
          console.log('User not found')
          return null
        }

        // Basit şifre kontrolü (test için)
        if (user.password !== credentials.password) {
          console.log('Invalid password')
          return null
        }

        console.log('Login successful:', user)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  debug: true, // Debug modunu açalım
})

export { handler as GET, handler as POST }