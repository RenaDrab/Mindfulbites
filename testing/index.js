const express = require('express');
const {createClient} = require('@supabase/supabase-js');

const app = express();
const port = 3000;

const supabaseURL='https://eivzsjkecyijcoedwzom.supabase.co';
const supabaseKey='sb_publishable__L-JFrzOXCrPv3xfnQ6rIQ_TW6hdpY-';
const supabase = createClient(supabaseURL, supabaseKey);

app.get('/question', async (req, res)=> {
    console.log('attempting to get questions');

    const{data, error} = await supabase.from('question').select();

    console.log('Recieved Data:', data);
    res.json(data);
})

app.listen(port, ()=> {
    console.log(`app is availible on port: ${port}`);
});

