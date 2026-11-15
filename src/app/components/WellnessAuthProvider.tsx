"use client";
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import {createClient,type SupabaseClient,type User} from "@supabase/supabase-js";

type Status="loading"|"signed_in"|"signed_out"|"error";
type Identity={firstName:string;lastName:string;photoPath:string|null;avatarUrl:string|null};
type AuthContextValue={client:SupabaseClient|null;user:User|null;status:Status;identity:Identity;refreshProfile:()=>Promise<void>;refreshAuth:()=>Promise<void>;signOut:()=>Promise<boolean>;recoveryMode:boolean;clearRecovery:()=>void};
const empty:Identity={firstName:"",lastName:"",photoPath:null,avatarUrl:null};
const Context=createContext<AuthContextValue|null>(null);

let browserClient:SupabaseClient|null|undefined;
export function getWellnessClient():SupabaseClient|null{
 if(typeof window==="undefined")return null;
 if(browserClient!==undefined)return browserClient;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 browserClient=url&&key?createClient(url,key):null;
 return browserClient;
}
export function AuthProvider({children}:{children:ReactNode}){
 const [client]=useState(getWellnessClient);
 const [user,setUser]=useState<User|null>(null);
 const [status,setStatus]=useState<Status>("loading");
 const [recoveryMode,setRecoveryMode]=useState(false);
 const [identity,setIdentity]=useState<Identity>(empty);
 const userId=useRef<string|null>(null);
 const currentRequest=useRef(0);
 const authRequest=useRef(0);
 const mounted=useRef(true);
 const loadProfile=useCallback(async(id:string)=>{
   if(!client)return;
   const request=++currentRequest.current;
   const {data,error}=await client.from("wellness_profiles")
     .select("first_name,last_name,photo_path").eq("user_id",id).maybeSingle();
   if(!mounted.current||request!==currentRequest.current||userId.current!==id)return;
   if(error){setIdentity(empty);return}
   const name={firstName:data?.first_name?.trim()||"",lastName:data?.last_name?.trim()||""};
   const photoPath=typeof data?.photo_path==="string"?data.photo_path:null;
   if(!photoPath){setIdentity({...name,photoPath:null,avatarUrl:null});return}
   // Storage bucket remains private. Never use a public URL for patient avatars.
   const {data:result,error:storageError}=await client.storage.from("wellness-avatars")
     .createSignedUrl(photoPath,900);
   if(!mounted.current||request!==currentRequest.current||userId.current!==id)return;
   setIdentity({...name,photoPath,avatarUrl:!storageError?(result?.signedUrl||null):null});
 },[client]);
 const refreshAuth=useCallback(async()=>{
   const request=++authRequest.current;
   if(!client){setStatus("error");return}
   try{
     const {data,error}=await client.auth.getUser();
     if(!mounted.current||request!==authRequest.current)return;
     if(error||!data.user){
       ++currentRequest.current;userId.current=null;setUser(null);setIdentity(empty);
       setStatus(error?"error":"signed_out");return;
     }
     const changed=userId.current!==data.user.id;
     userId.current=data.user.id;
     setUser(data.user);setStatus("signed_in");
     if(changed){setIdentity(empty)}
     await loadProfile(data.user.id);
   }catch{
     if(mounted.current&&request===authRequest.current){++currentRequest.current;userId.current=null;setUser(null);setIdentity(empty);setStatus("error")}
   }
 },[client,loadProfile]);
 const refreshProfile=useCallback(async()=>{if(userId.current)await loadProfile(userId.current)},[loadProfile]);
 const signOut=useCallback(async()=>{
   if(!client)return false;
   const {error}=await client.auth.signOut();
   if(error)return false;
   ++authRequest.current;++currentRequest.current;userId.current=null;
   setUser(null);setIdentity(empty);setStatus("signed_out");setRecoveryMode(false);
   return true;
 },[client]);
 useEffect(()=>{
   mounted.current=true;
   void refreshAuth();
   if(!client)return()=>{mounted.current=false};
   const {data:subscription}=client.auth.onAuthStateChange(event=>{
     if(event==="PASSWORD_RECOVERY"){setRecoveryMode(true);queueMicrotask(()=>{if(mounted.current)void refreshAuth()});}
     else if(event==="SIGNED_OUT"){
       ++authRequest.current;++currentRequest.current;userId.current=null;
       setUser(null);setIdentity(empty);setStatus("signed_out");
     }else if(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="USER_UPDATED"){
       // Do not await Supabase requests inside the auth change callback.
       queueMicrotask(()=>{if(mounted.current)void refreshAuth()});
     }
   });
   const onVisible=()=>{if(document.visibilityState==="visible")void refreshAuth()};
   document.addEventListener("visibilitychange",onVisible);
   const refreshAvatar=setInterval(()=>{if(userId.current)void loadProfile(userId.current)},10*60*1000);
   return()=>{mounted.current=false;++authRequest.current;++currentRequest.current;subscription.subscription.unsubscribe();document.removeEventListener("visibilitychange",onVisible);clearInterval(refreshAvatar)};
 },[client,refreshAuth,loadProfile]);
 return <Context.Provider value={{client,user,status,identity,refreshProfile,refreshAuth,signOut,recoveryMode,clearRecovery:()=>setRecoveryMode(false)}}>{children}</Context.Provider>;
}
export function useWellnessAuth(){
 const value=useContext(Context);
 if(!value)throw new Error("AuthProvider missing");
 return value;
}
