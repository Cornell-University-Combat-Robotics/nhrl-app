import { supabase } from './supabaseClient'

async function retrieveRobot(){
    const { data, error } = await supabase 
        .from('robots')
        .select('robot_name')

    if (error) {
        console.log("Error when retrieving robot data: ", error)
    } else {
        console.log("Robot data retrieved: ", data)
    }
}

export default retrieveRobot;