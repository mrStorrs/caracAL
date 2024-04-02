import { MerchantStatus } from "../enums/MerchantStatus";

export var MERCHANT_INFO = {
    status: "bored"
}

export var PARTY  = {
    currentTargets: new Map<string,string>()
}

export var BOT = {
    status: MerchantStatus.BORED.toString()
}

