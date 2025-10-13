const axios = require('axios');

const getLanguageId = (lang) => {
    lang = lang.toLowerCase();
    const languages = {
        'c++': 105,
        'java': 91,
        'python': 71,
        'javascript': 102
    }

    return languages[lang];
}

const submitBatch = async (mySubmissionArr) => {
    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'false'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_API_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions: mySubmissionArr
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    const result  = await fetchData();
    return result;
}

const waiting = async(delayTime)=>{
    setTimeout(()=>{
        console.log("Waiting...");
    }, delayTime);
}

const submitTokens = async (arrOfTokens) => {
   
    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: arrOfTokens.join(','),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_API_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }

    while(true){
        const result =  await fetchData();
        const isResultObtained = result.submissions.every((obj)=>obj.status_id>2)
        if(isResultObtained){
            return result.submissions;
        }
        await waiting(1000);
    }


}
module.exports = { getLanguageId, submitBatch, submitTokens };







