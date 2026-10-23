'use client';
import React,{useMemo,useRef} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import type {Group,Mesh} from 'three';

function AromaticKitchen(){
 const pot=useRef<Group>(null),vapor=useRef<Group>(null),tadka=useRef<Group>(null),leaves=useRef<Group>(null);
 const seeds=useMemo(()=>Array.from({length:28},(_,i)=>({angle:i*2.39996,radius:.25+(i%7)*.14,offset:(i%4)*.018})),[]);
 useFrame(({clock,pointer},dt)=>{
   const t=clock.elapsedTime;
   if(pot.current){pot.current.rotation.y=Math.sin(t*.21)*.10+pointer.x*.12;pot.current.rotation.x=.06+pointer.y*.045;}
   if(vapor.current){vapor.current.position.y=Math.sin(t*.72)*.09;vapor.current.rotation.y+=Math.min(dt,.05)*.13;vapor.current.scale.setScalar(1+.045*Math.sin(t*.91));}
   if(tadka.current){tadka.current.rotation.y=t*.055;tadka.current.position.y=.025+Math.sin(t*4)*.015;}
   if(leaves.current){leaves.current.rotation.y=t*.13;leaves.current.position.y=.25+Math.sin(t*1.8)*.09;}
 });
 return <group ref={pot}>
   {/* Hand-finished dark-iron cookware, warm brass rim, firelit countertop. */}
   <mesh position={[0,-1.06,0]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[1.95,1.95,.08,56]}/><meshStandardMaterial color="#987453" roughness={.88}/></mesh>
   <mesh position={[0,-.15,0]}><sphereGeometry args={[1.43,56,32,0,Math.PI*2,Math.PI/2,Math.PI/2]}/><meshStandardMaterial color="#602516" metalness={.53} roughness={.35} side={2}/></mesh>
   <mesh position={[0,-.14,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[1.38,.075,14,72]}/><meshStandardMaterial color="#dfaa53" metalness={.75} roughness={.22}/></mesh>
   {[-1,1].map(sign=><mesh key={sign} position={[sign*1.58,-.17,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.34,.11,12,38]}/><meshStandardMaterial color="#9a4629" metalness={.55} roughness={.4}/></mesh>)}
   <mesh position={[0,.005,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.30,48]}/><meshStandardMaterial color="#37170f" roughness={.47} emissive="#a34b1b" emissiveIntensity={.16}/></mesh>
   <group ref={tadka}>
     {seeds.map((s,i)=><mesh key={i} position={[Math.cos(s.angle)*s.radius,.035+s.offset,Math.sin(s.angle)*s.radius]}><sphereGeometry args={[.032+(i%3)*.009,10,10]}/><meshStandardMaterial color={i%5===0?'#e1a233':i%3===0?'#ffbc4c':'#1f1611'} metalness={i%5===0?.25:0}/></mesh>)}
     {Array.from({length:8},(_,i)=><mesh key={'spice'+i} position={[Math.cos(i*1.49)*.7,.06,Math.sin(i*1.49)*.6]} rotation={[0,i,0]}><sphereGeometry args={[.08,.025,.16,12,9]}/><meshStandardMaterial color={i%2===0?'#9e1d16':'#416727'} roughness={.5}/></mesh>)}
   </group>
   <group ref={leaves}>{Array.from({length:6},(_,i)=><group key={i} position={[Math.sin(i*2.3)*.65,.1+(i%3)*.15,Math.cos(i*2.3)*.65]} rotation={[i*.17,i*1.2,.8]}><mesh><sphereGeometry args={[.1,.022,.24,14,10]}/><meshStandardMaterial color={i%2===0?'#3c652e':'#6b842e'} roughness={.82} side={2}/></mesh></group>)}</group>
   <group ref={vapor}>{[0,1,2,3,4].map(i=><group key={i} position={[(i-2)*.28,1.15+(i%2)*.28,0]} rotation={[0,i*.45,i%2?.28:-.28]}><mesh><torusGeometry args={[.38+(i%3)*.08,.026,7,58,Math.PI*1.52]}/><meshStandardMaterial color="#ffebba" transparent opacity={.42-(i%3)*.07} emissive="#e6aa58" emissiveIntensity={.42} depthWrite={false}/></mesh></group>)}</group>
  </group>;
}
export default function KadaiScene(){return <div className="kadai-3d" role="img" aria-label="Slowly turning 3D traditional cooking vessel with shimmering mustard seeds, moving curry leaves and golden steam"><Canvas camera={{position:[0,1.3,5.1],fov:44}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} dpr={[1,1.6]}><ambientLight intensity={.8}/><hemisphereLight args={['#ffe6ae','#3a1c13',1.1]}/><directionalLight position={[3,5,6]} intensity={2.3} color="#ffe2aa"/><pointLight position={[-3,1,-2]} intensity={2.4} color="#eeaa62"/><AromaticKitchen/></Canvas></div>}
