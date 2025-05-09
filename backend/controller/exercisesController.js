import { supabase } from '../database/supabaseClient.js';

export async function testDbConnection(req, res) {
    try {
        // Query the exercises table
        const { data, error } = await supabase.from('exercises')
            .select('*')
            .limit(2); 
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).json({ error: error.message });
        }
        
        res.json({
            message: 'Database connection successful',
            status: 'connected',
            data: data
        });
    } catch (err) {
        console.error('Network or unexpected error:', err);
        res.status(500).json({
            error: 'Failed to connect to Supabase API',
            message: err.message
        });
    }
}