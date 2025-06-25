import mongoose from 'mongoose';
import { Subcriotion } from './subscription.model';

const subscriptionSchema = new Schema({
    subscriber : {
        type : Schema.Types.ObjectId, //one who is subscribing
        ref:"User"
    },
    channel : {
        type : Schema.Types.ObjectId, //one to whom "subscriber" is subscribing
        ref:"User"
    },

},{timestamp:true})

export const Subcriotion = mongoose.model("Subscription", subscriptionSchema)