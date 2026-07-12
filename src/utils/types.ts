export interface payloadData{
id:string
name:string
email:string
role:string
}
export interface RequestWithUser extends Request{
    user?:payloadData
}