const Problem = require('../models/problems');
const Submission = require('../models/submission');
const { getLanguageId, submitBatch, submitTokens } = require('../utils/problemUtility');
const redisClient = require('../config/redis');

const submitCodeRateLimiter = async (req, res, next) => {
    const userId = req.result._id;
    const redisKey = `submit_cooldown:${userId}`;

    try {
        // Check if user has a recent submission
        const exists = await redisClient.exists(redisKey);

        if (exists) {
            return res.status(429).json({
                error: 'Please wait 10 seconds before submitting again'
            });
        }

        // Set cooldown period
        await redisClient.set(redisKey, 'cooldown_active', {
            EX: 10, // Expire after 10 seconds
            NX: true // Only set if not exists
        });

        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const submitCode = async (req, res) => {
    try {

        const userId = req.result._id;
        const problemId = req.params.id;

        const { code, language } = req.body;

        //validating above fields
        if (!userId || !problemId || !code || !language) {
            return res.status(400).send("Some fields missing");
        }

        //fetching problem 
        const problem = await Problem.findById(problemId);

       
        //initially save the submitted code with some other details in the DB
        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            status:'pending',
            testCasesTotal: problem.hiddenTestCases.length
        });

        // Pass the code to judge0 to execute 
        const languageId = getLanguageId(language);
        const submissions = problem.hiddenTestCases.map((testcase) => {
            return {
                source_code: code,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }
        });

        const submitResult = await submitBatch(submissions);

        const arrOfTokens = submitResult.map((obj) => {
            return obj.token;
        })

        const testResult = await submitTokens(arrOfTokens);

        // update submittedResult
        let passedTCCount = 0;
        let totalRuntime = 0;
        let maxMemory = 0;
        let finalStatus = 'accepted';
        let finalErrMsg = null;
        for (let test of testResult) {
            if (test.status_id == 3) {
                passedTCCount += 1;
                totalRuntime += parseFloat(test.time);
                maxMemory = Math.max(maxMemory, test.memory);
            }
            else if (test.status_id == 4) {
                finalStatus = 'wrong';
                finalErrMsg = test.stderr;
            }
            else {
                finalStatus = 'error';
                finalErrMsg = test.stderr;
            }
        }

        submittedResult.status = finalStatus;
        submittedResult.errorMessage = finalErrMsg;
        submittedResult.testCasesPassed = passedTCCount;
        submittedResult.runtime = totalRuntime;
        submittedResult.memory = maxMemory;

        await submittedResult.save();

        // add the problem id to the user document
        if (finalStatus === 'accepted' && !req.result.problemSolved.includes(problemId)) {
            req.result.problemSolved.push(problemId);
            await req.result.save();
        }

        const accepted = (finalStatus == 'accepted');
        res.status(201).json({
            accepted,
            totalTestCases: submittedResult.testCasesTotal,
            passedTestCases: passedTCCount,
            runtime: totalRuntime,
            memory: maxMemory
        })
    }
    catch (err) {
        res.status(500).send(err);
    }


}

const runCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.id;

        const { code, language } = req.body;

        //validating above fields
        if (!userId || !problemId || !code || !language) {
            return res.status(400).send("Some fields missing");
        }

        //fetching problem 
        const problem = await Problem.findById(problemId);


        // Pass the code to judge0 to execute 
        const languageId = getLanguageId(language);
        const submissions = problem.visibleTestCases.map((testcase) => {
            return {
                source_code: code,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output
            }
        });

        const submitResult = await submitBatch(submissions);

        const arrOfTokens = submitResult.map((obj) => {
            return obj.token;
        })

        const testResult = await submitTokens(arrOfTokens);

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = true;
        let errorMessage = null;

        for (const test of testResult) {
            if (test.status_id == 3) {
                testCasesPassed++;
                runtime = runtime + parseFloat(test.time)
                memory = Math.max(memory, test.memory);
            } else {
                if (test.status_id == 4) {
                    status = false
                    errorMessage = test.stderr
                }
                else {
                    status = false
                    errorMessage = test.stderr
                }
            }
        }



        res.status(201).json({
            success: status,
            testCases: testResult,
            runtime,
            memory
        });

    }
    catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
}


module.exports = { submitCode, runCode, submitCodeRateLimiter };