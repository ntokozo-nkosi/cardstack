import { auth, currentUser } from '@clerk/nextjs/server'
import { query } from './database'

export async function getCurrentUserDb() {
    const { userId: clerkId } = await auth()
    const user = await currentUser()

    if (!clerkId || !user) {
        return null
    }

    const email = user.emailAddresses[0]?.emailAddress

    const result = await query(
        'SELECT * FROM get_or_create_user($1, $2)',
        [clerkId, email]
    )

    const row = result.rows[0]
    if (!row) return null

    return {
        id: row.user_id,
        clerk_id: row.user_clerk_id,
        email: row.user_email,
        created_at: row.user_created_at
    }
}
