'use client';import {useState} from 'react';
export default function DishImage({url,name}:{url?:string|null;name:string}){const[failed,setFailed]=useState(false);return <div className="dish-image">{!failed&&url?<img src={url} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<div className="image-fallback"><span>🍲</span><small>{name}</small></div>}</div>}
