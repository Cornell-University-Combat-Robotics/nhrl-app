import { supabase } from './supabaseClient';

//prebuilt robots -- our mutation fxn
async function addRobot(robot_name: string){
    const { data, error } = await supabase
        .from('robots')
        .insert({ robot_name: robot_name })
        .select();

    if (error) {
        console.error("Insert failed:", error.message);
    } else { //when error = null
        console.log("Inserted row:", data);
    }
}

export default addRobot;
