module.exports.checkSnowflake = function(snowflake) {
    if(!snowflake) { return false; } /* Is it null? */
    if(!/^\d+$/.test(snowflake)) { return false; } /* is it a number? */
    if(BigInt(snowflake) < 0 || BigInt(snowflake) > BigInt('18446744073709551615')) { return false; } /* Is it a 64-bit number? */
    return true;
};