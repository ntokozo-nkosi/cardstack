import { tool, DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { query } from '@/lib/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChatTool = DynamicStructuredTool<any, any, any, any>

/**
 * Execute a tool by name with the given arguments.
 * This helper function handles the type-safe execution of heterogeneous tools.
 */
export async function executeTool(
    tools: ChatTool[],
    toolName: string,
    args: Record<string, unknown>
): Promise<string> {
    const tool = tools.find(t => t.name === toolName)
    if (!tool) {
        return `Error: Unknown tool "${toolName}"`
    }

    try {
        const result = await tool.invoke(args)
        return typeof result === 'string' ? result : JSON.stringify(result)
    } catch (error) {
        return `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
}

/**
 * Factory function that creates tools with userId in closure for security.
 * Each tool has direct database access using the same patterns as API routes.
 */
export function createToolsForUser(userId: string): ChatTool[] {

    // 1. List all collections with deck counts
    const list_collections = tool(
        async () => {
            try {
                const result = await query(`
          SELECT 
            c.id,
            c.name,
            c.description,
            c.created_at as "createdAt",
            COUNT(cd.deck_id)::int as deck_count
          FROM collections c
          LEFT JOIN collection_decks cd ON cd.collection_id = c.id
          WHERE c.user_id = $1
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `, [userId])

                if (result.rows.length === 0) {
                    return 'No collections found. The user has not created any collections yet.'
                }

                return JSON.stringify(result.rows, null, 2)
            } catch (error) {
                return `Error listing collections: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'list_collections',
            description: 'List all user collections with their deck counts. Returns collection id, name, description, creation date, and number of decks in each collection.',
            schema: z.object({})
        }
    )

    // 2. View collection details with decks
    const view_collection = tool(
        async ({ collectionId }) => {
            try {
                const result = await query(
                    'SELECT get_collection_with_decks($1, $2) as collection',
                    [collectionId, userId]
                )

                const collection = result.rows[0]?.collection

                if (!collection) {
                    return `Collection not found with ID: ${collectionId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify(collection, null, 2)
            } catch (error) {
                return `Error viewing collection: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'view_collection',
            description: 'Get detailed information about a specific collection including all decks within it. Each deck includes its card count.',
            schema: z.object({
                collectionId: z.string().uuid().describe('The UUID of the collection to view')
            })
        }
    )

    // 3. List all decks with card counts
    const list_decks = tool(
        async () => {
            try {
                const result = await query(`
          SELECT 
            d.id,
            d.name,
            d.description,
            d.created_at as "createdAt",
            COUNT(c.id)::int as card_count
          FROM decks d
          LEFT JOIN cards c ON c.deck_id = d.id
          WHERE d.user_id = $1
          GROUP BY d.id
          ORDER BY d.created_at DESC
        `, [userId])

                if (result.rows.length === 0) {
                    return 'No decks found. The user has not created any decks yet.'
                }

                return JSON.stringify(result.rows, null, 2)
            } catch (error) {
                return `Error listing decks: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'list_decks',
            description: 'List all user decks with their card counts. Returns deck id, name, description, creation date, and number of cards in each deck.',
            schema: z.object({})
        }
    )

    // 4. View deck details with cards
    const view_deck = tool(
        async ({ deckId }) => {
            try {
                const result = await query(
                    'SELECT get_deck_with_cards($1, $2) as deck',
                    [deckId, userId]
                )

                const deck = result.rows[0]?.deck

                if (!deck) {
                    return `Deck not found with ID: ${deckId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify(deck, null, 2)
            } catch (error) {
                return `Error viewing deck: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'view_deck',
            description: 'Get detailed information about a specific deck including all flashcards within it.',
            schema: z.object({
                deckId: z.string().uuid().describe('The UUID of the deck to view')
            })
        }
    )

    // 5. Create a new collection
    const create_collection = tool(
        async ({ name, description }) => {
            try {
                if (!name || name.trim() === '') {
                    return 'Error: Collection name is required and cannot be empty.'
                }

                const result = await query(
                    `INSERT INTO collections (name, description, user_id) 
           VALUES ($1, $2, $3) 
           RETURNING id, name, description, created_at as "createdAt"`,
                    [name.trim(), description?.trim() || null, userId]
                )

                return JSON.stringify({
                    success: true,
                    message: `Collection "${name.trim()}" created successfully.`,
                    collection: result.rows[0]
                }, null, 2)
            } catch (error) {
                return `Error creating collection: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'create_collection',
            description: 'Create a new collection to organize decks. Collections help group related decks together.',
            schema: z.object({
                name: z.string().min(1).describe('The name for the new collection (required)'),
                description: z.string().optional().describe('An optional description for the collection')
            })
        }
    )

    // 6. Create a new deck
    const create_deck = tool(
        async ({ name, description }) => {
            try {
                if (!name || name.trim() === '') {
                    return 'Error: Deck name is required and cannot be empty.'
                }

                const result = await query(
                    `INSERT INTO decks (name, description, user_id) 
           VALUES ($1, $2, $3) 
           RETURNING id, name, description, created_at as "createdAt"`,
                    [name.trim(), description?.trim() || null, userId]
                )

                return JSON.stringify({
                    success: true,
                    message: `Deck "${name.trim()}" created successfully.`,
                    deck: result.rows[0]
                }, null, 2)
            } catch (error) {
                return `Error creating deck: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'create_deck',
            description: 'Create a new deck to hold flashcards. Decks are containers for flashcards on a specific topic.',
            schema: z.object({
                name: z.string().min(1).describe('The name for the new deck (required)'),
                description: z.string().optional().describe('An optional description for the deck')
            })
        }
    )

    // 7. Update collection name/description
    const update_collection = tool(
        async ({ collectionId, name, description }) => {
            try {
                if (!name || name.trim() === '') {
                    return 'Error: Collection name is required and cannot be empty.'
                }

                const result = await query(
                    `UPDATE collections 
           SET name = $1, description = $2 
           WHERE id = $3 AND user_id = $4
           RETURNING id, name, description, created_at as "createdAt"`,
                    [name.trim(), description?.trim() || null, collectionId, userId]
                )

                if (result.rows.length === 0) {
                    return `Collection not found with ID: ${collectionId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify({
                    success: true,
                    message: `Collection updated successfully.`,
                    collection: result.rows[0]
                }, null, 2)
            } catch (error) {
                return `Error updating collection: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'update_collection',
            description: 'Update an existing collection\'s name and/or description.',
            schema: z.object({
                collectionId: z.string().uuid().describe('The UUID of the collection to update'),
                name: z.string().min(1).describe('The new name for the collection (required)'),
                description: z.string().optional().describe('The new description for the collection (optional, can clear with empty string)')
            })
        }
    )

    // 8. Update deck name/description
    const update_deck = tool(
        async ({ deckId, name, description }) => {
            try {
                if (!name || name.trim() === '') {
                    return 'Error: Deck name is required and cannot be empty.'
                }

                const result = await query(
                    `UPDATE decks SET name = $1, description = $2 
           WHERE id = $3 AND user_id = $4
           RETURNING id, name, description, created_at as "createdAt"`,
                    [name.trim(), description?.trim() || null, deckId, userId]
                )

                if (result.rows.length === 0) {
                    return `Deck not found with ID: ${deckId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify({
                    success: true,
                    message: `Deck updated successfully.`,
                    deck: result.rows[0]
                }, null, 2)
            } catch (error) {
                return `Error updating deck: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'update_deck',
            description: 'Update an existing deck\'s name and/or description.',
            schema: z.object({
                deckId: z.string().uuid().describe('The UUID of the deck to update'),
                name: z.string().min(1).describe('The new name for the deck (required)'),
                description: z.string().optional().describe('The new description for the deck (optional, can clear with empty string)')
            })
        }
    )

    // 9. Add deck to collection
    const add_deck_to_collection = tool(
        async ({ collectionId, deckId }) => {
            try {
                const result = await query(
                    'SELECT add_deck_to_collection_if_owned($1, $2, $3) as status',
                    [collectionId, deckId, userId]
                )

                const status = result.rows[0]?.status

                if (status === 'COLLECTION_NOT_FOUND') {
                    return `Collection not found with ID: ${collectionId}. It may not exist or may belong to another user.`
                }

                if (status === 'DECK_NOT_FOUND') {
                    return `Deck not found with ID: ${deckId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify({
                    success: true,
                    message: `Deck successfully added to collection.`
                }, null, 2)
            } catch (error) {
                return `Error adding deck to collection: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'add_deck_to_collection',
            description: 'Add an existing deck to an existing collection. This creates a link between the deck and collection.',
            schema: z.object({
                collectionId: z.string().uuid().describe('The UUID of the collection to add the deck to'),
                deckId: z.string().uuid().describe('The UUID of the deck to add to the collection')
            })
        }
    )

    // 10. Remove deck from collection
    const remove_deck_from_collection = tool(
        async ({ collectionId, deckId }) => {
            try {
                const result = await query(
                    'SELECT remove_deck_from_collection_if_owned($1, $2, $3) as status',
                    [collectionId, deckId, userId]
                )

                const status = result.rows[0]?.status

                if (status === 'COLLECTION_NOT_FOUND') {
                    return `Collection not found with ID: ${collectionId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify({
                    success: true,
                    message: `Deck successfully removed from collection.`
                }, null, 2)
            } catch (error) {
                return `Error removing deck from collection: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'remove_deck_from_collection',
            description: 'Remove a deck from a collection. This only removes the link; the deck itself is not deleted.',
            schema: z.object({
                collectionId: z.string().uuid().describe('The UUID of the collection to remove the deck from'),
                deckId: z.string().uuid().describe('The UUID of the deck to remove from the collection')
            })
        }
    )

    // 11. Create a new flashcard in a deck
    const create_flashcard = tool(
        async ({ deckId, front, back }) => {
            try {
                if (!front || front.trim() === '') {
                    return 'Error: Flashcard front text is required and cannot be empty.'
                }
                if (!back || back.trim() === '') {
                    return 'Error: Flashcard back text is required and cannot be empty.'
                }

                // Verify deck ownership before creating card
                const deckCheck = await query(
                    'SELECT id FROM decks WHERE id = $1 AND user_id = $2',
                    [deckId, userId]
                )

                if (deckCheck.rows.length === 0) {
                    return `Deck not found with ID: ${deckId}. It may not exist or may belong to another user.`
                }

                const result = await query(
                    `INSERT INTO cards (deck_id, front, back)
                     VALUES ($1, $2, $3)
                     RETURNING id, deck_id as "deckId", front, back, created_at as "createdAt"`,
                    [deckId, front.trim(), back.trim()]
                )

                return JSON.stringify({
                    success: true,
                    message: `Flashcard created successfully.`,
                    card: result.rows[0]
                }, null, 2)
            } catch (error) {
                return `Error creating flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'create_flashcard',
            description: 'Create a new flashcard in a specific deck. Flashcards have a front (question/prompt) and back (answer). If the user has only one deck or the context makes the target deck obvious, use it directly. Otherwise, ask the user which deck to add the flashcard to.',
            schema: z.object({
                deckId: z.string().uuid().describe('The UUID of the deck to add the flashcard to'),
                front: z.string().min(1).describe('The front text of the flashcard (question or prompt)'),
                back: z.string().min(1).describe('The back text of the flashcard (answer)')
            })
        }
    )

    // 12. Update an existing flashcard
    const update_flashcard = tool(
        async ({ cardId, front, back }) => {
            try {
                if (!front || front.trim() === '') {
                    return 'Error: Flashcard front text is required and cannot be empty.'
                }
                if (!back || back.trim() === '') {
                    return 'Error: Flashcard back text is required and cannot be empty.'
                }

                const result = await query(
                    'SELECT update_card_if_owned($1, $2, $3, $4) as card',
                    [cardId, userId, front.trim(), back.trim()]
                )

                const card = result.rows[0]?.card

                if (!card) {
                    return `Flashcard not found with ID: ${cardId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify({
                    success: true,
                    message: `Flashcard updated successfully.`,
                    card
                }, null, 2)
            } catch (error) {
                return `Error updating flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
        },
        {
            name: 'update_flashcard',
            description: 'Update an existing flashcard\'s front and/or back text.',
            schema: z.object({
                cardId: z.string().uuid().describe('The UUID of the flashcard to update'),
                front: z.string().min(1).describe('The new front text of the flashcard (question or prompt)'),
                back: z.string().min(1).describe('The new back text of the flashcard (answer)')
            })
        }
    )

    // 13. Bulk create flashcards in a deck
    const bulk_create_flashcards = tool(
        async ({ deckId, cards }) => {
            try {
                if (!cards || cards.length < 2) {
                    return 'Error: Bulk create requires at least 2 flashcards. Use create_flashcard for single cards.'
                }

                // Validate all cards have front and back
                for (const card of cards) {
                    if (!card.front?.trim() || !card.back?.trim()) {
                        return 'Error: Each flashcard must have non-empty front and back text.'
                    }
                }

                const result = await query(
                    'SELECT * FROM bulk_create_cards($1, $2, $3)',
                    [deckId, userId, JSON.stringify(cards)]
                )

                if (result.rows.length === 0) {
                    return `Deck not found with ID: ${deckId}. It may not exist or may belong to another user.`
                }

                return JSON.stringify({
                    success: true,
                    message: `Successfully created ${result.rows.length} flashcards.`,
                    cards: result.rows
                }, null, 2)
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                if (message.includes('Deck not found') || message.includes('access denied')) {
                    return `Deck not found with ID: ${deckId}. It may not exist or may belong to another user.`
                }
                return `Error creating flashcards: ${message}`
            }
        },
        {
            name: 'bulk_create_flashcards',
            description: 'Create multiple flashcards in a single deck. Use this tool when adding 2 or more flashcards to the same deck. For single flashcards, use create_flashcard instead.',
            schema: z.object({
                deckId: z.string().uuid().describe('The UUID of the deck to add the flashcards to'),
                cards: z.array(z.object({
                    front: z.string().min(1).describe('The front text of the flashcard'),
                    back: z.string().min(1).describe('The back text of the flashcard')
                })).min(2).describe('Array of flashcards to create (minimum 2)')
            })
        }
    )

    return [
        list_collections,
        view_collection,
        list_decks,
        view_deck,
        create_collection,
        create_deck,
        update_collection,
        update_deck,
        add_deck_to_collection,
        remove_deck_from_collection,
        create_flashcard,
        update_flashcard,
        bulk_create_flashcards
    ]
}
