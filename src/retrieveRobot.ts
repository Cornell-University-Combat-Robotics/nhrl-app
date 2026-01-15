import { supabase } from './supabaseClient'

async function retrieveRobot(){
    const { data, error } = await supabase 
        .from('robots')
        .select('robot_name')
        .order('robot_id', { ascending: false })
        .limit(1)

    if (error) {
        console.log("Error when retrieving robot data: ", error)
        return null
    } else {
        console.log("Robot data retrieved: ", data)
        return data[0] // e.g. returns { robot_name: "RobotX" } - newest entry
    }
}

export default retrieveRobot;