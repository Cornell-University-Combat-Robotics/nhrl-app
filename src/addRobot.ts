import { supabase } from './supabaseClient';

//prebuilt robots
async function addRobot(){
    const { data, error } = await supabase
        .from('robots')
        .insert({ robot_name: "Beater" });

    if (error) {
        console.error("Insert failed:", error.message);
    } else { //when error = null
        console.log("Inserted row:", data);
    }
}

export default addRobot;
