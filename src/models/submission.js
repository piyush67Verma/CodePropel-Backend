const mongoose = require('mongoose');
const {Schema} = mongoose;

const submissionSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'users', 
        required:true
    }, 
    problemId:{
        type:Schema.Types.ObjectId,
        ref:'problems', 
        required:true
    },
    code:{
        type:String,
        required:true
    },
    language:{
        type:String,
        required:true,
        enum:['C++', 'Java', 'JavaScript']
    }, 
    status:{
        type:String,
        enum:['pending','accepted', 'wrong', 'error'],
        required:true,
        default:'pending'
    }, 
    runtime:{
        type:Number,
        default:0
    },
    memory:{
        type:Number,
        default:0
    },
    errorMessage:{
        type:String,
        default:''
    },
    testCasesPassed:{
        type:Number,
        default:0
    },
    testCasesTotal:{
        type:Number,
        default:0
    }
    
}, {timestamps:true});

// compound indexing 
submissionSchema.index({userId:1, problemId:1});

const Submission = mongoose.model('submissions', submissionSchema);

module.exports = Submission;