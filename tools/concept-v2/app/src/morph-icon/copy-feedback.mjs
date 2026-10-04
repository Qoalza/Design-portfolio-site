export const COPY_FEEDBACK_MS=2000;

export function restartFeedbackTimer(currentTimer,schedule,cancel,onReset){
 if(currentTimer!==null) cancel(currentTimer);
 return schedule(onReset,COPY_FEEDBACK_MS);
}
