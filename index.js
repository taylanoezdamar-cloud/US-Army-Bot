const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const personalDatei = './personal.json';
if (!fs.existsSync(personalDatei)) fs.writeFileSync(personalDatei, JSON.stringify({ personal: [] }, null, 2));
function personalLaden() { try { const d = JSON.parse(fs.readFileSync(personalDatei, 'utf8')); if (!Array.isArray(d.personal)) d.personal=[]; return d; } catch(e) { console.error(e); return {personal:[]}; } }
function personalSpeichern(d) { try { fs.writeFileSync(personalDatei, JSON.stringify(d,null,2)); return true; } catch(e) { console.error(e); return false; } }

const armyRaenge = [
'[21] General of the Army','[20] General','[19] Lieutnant General','[18] Captain','[17] First Lieutenant','[16] Second Lieutenant','[15] Chief Warrant Officer III','[14] Chief Warrant Officer II','[13] Chief Warrant Officer I','[12] Warrant Officer II','[11] Warrant Officer I','[10] Command Sergeant Major','[09] First Sergeant','[08] Master Sergeant','[07] Sergeant First Class','[06] Staff Sergeant','[05] Sergeant','[04] Corporal','[03] Specialist','[02] Private First Class','[01] Private Second Class'
];
const rangDaten = {
'[21] General of the Army':['01','02'], '[20] General':['03','04'], '[19] Lieutnant General':['05','06']
};
const zusatzRollen = ['U.S.Army','General','Field Grade Officer','Hauptleute','Leutnant','Unteroffiziere','Mannschaft','Abteilungen'];
function zusatzRollenFuerRang(r) {
 if(['[21] General of the Army','[20] General','[19] Lieutnant General'].includes(r)) return ['U.S.Army','General','Field Grade Officer','Hauptleute','Leutnant','Unteroffiziere','Mannschaft','Abteilungen'];
 if(['[18] Captain','[17] First Lieutenant','[16] Second Lieutenant'].includes(r)) return ['U.S.Army','Field Grade Officer','Hauptleute','Leutnant','Unteroffiziere','Mannschaft','Abteilungen'];
 if(['[15] Chief Warrant Officer III','[14] Chief Warrant Officer II'].includes(r)) return ['U.S.Army','Hauptleute','Leutnant','Unteroffiziere','Mannschaft','Abteilungen'];
 if(['[13] Chief Warrant Officer I','[12] Warrant Officer II'].includes(r)) return ['U.S.Army','Leutnant','Unteroffiziere','Mannschaft','Abteilungen'];
 if(['[11] Warrant Officer I','[10] Command Sergeant Major','[09] First Sergeant','[08] Master Sergeant','[07] Sergeant First Class','[06] Staff Sergeant','[05] Sergeant'].includes(r)) return ['U.S.Army','Unteroffiziere','Mannschaft','Abteilungen'];
 if(['[04] Corporal','[03] Specialist','[02] Private First Class','[01] Private Second Class'].includes(r)) return ['U.S.Army','Mannschaft','Abteilungen'];
 return [];
}
function freieZufallsDN(personal) {
 const used=new Set(personal.personal.map(p=>String(p.dienstnummer)));
 const free=[]; for(let i=7;i<=99;i++){const n=String(i).padStart(2,'0'); if(!used.has(n)) free.push(n);} return free.length ? free[Math.floor(Math.random()*free.length)] : null;
}
function dienstnummerEinstellen(personal,rang) {
 if(rangDaten[rang]) return rangDaten[rang].find(n=>!personal.personal.some(p=>String(p.dienstnummer)===n)) || null;
 return freieZufallsDN(personal);
}
function dienstnummerUprank(personal,rang,ownDN) {
 if(rangDaten[rang]) return rangDaten[rang].find(n=>!personal.personal.some(p=>String(p.dienstnummer)===n && String(p.dienstnummer)!==String(ownDN))) || null;
 const used=new Set(personal.personal.filter(p=>String(p.dienstnummer)!==String(ownDN)).map(p=>String(p.dienstnummer)));
 const free=[]; for(let i=7;i<=99;i++){const n=String(i).padStart(2,'0'); if(!used.has(n)) free.push(n);} return free.length ? free[Math.floor(Math.random()*free.length)] : null;
}
const ARMY_BILD_URL='';

const commands=[
 new SlashCommandBuilder().setName('ping').setDescription('Zeigt die Antwortzeit des Bots an.'),
 new SlashCommandBuilder().setName('personal').setDescription('Personalverwaltung der U.S.Army')
 .addSubcommand(s=>s.setName('einstellen').setDescription('Stellt ein Mitglied bei der U.S.Army ein.')
  .addUserOption(o=>o.setName('mitglied').setDescription('Discord-Mitglied').setRequired(true))
  .addStringOption(o=>o.setName('ic_name').setDescription('IC-Name').setRequired(true))
  .addStringOption(o=>o.setName('rang').setDescription('Rang').setRequired(true).addChoices(...armyRaenge.map(r=>({name:r,value:r})))))
 .addSubcommand(s=>s.setName('entlassen').setDescription('Entlässt ein Mitglied aus der U.S.Army.')
  .addUserOption(o=>o.setName('mitglied').setDescription('Discord-Mitglied').setRequired(true))
  .addStringOption(o=>o.setName('ic_name').setDescription('IC-Name').setRequired(true))
  .addStringOption(o=>o.setName('grund').setDescription('Grund der Kündigung').setRequired(true)))
 .addSubcommand(s=>s.setName('uprank').setDescription('Befördert ein Mitglied.')
  .addUserOption(o=>o.setName('mitglied').setDescription('Discord-Mitglied').setRequired(true))
  .addStringOption(o=>o.setName('alter_rang').setDescription('Bisheriger Rang').setRequired(true).addChoices(...armyRaenge.map(r=>({name:r,value:r}))))
  .addStringOption(o=>o.setName('neuer_rang').setDescription('Neuer Rang').setRequired(true).addChoices(...armyRaenge.map(r=>({name:r,value:r}))))
  .addStringOption(o=>o.setName('grund').setDescription('Grund der Beförderung').setRequired(true)))
].map(c=>c.toJSON());

client.once('ready',async()=>{ console.log(`✅ Bot online: ${client.user.tag}`); try { const rest=new REST({version:'10'}).setToken(process.env.DISCORD_TOKEN); await rest.put(Routes.applicationCommands(client.user.id),{body:commands}); console.log('✅ Slash Commands registriert.'); } catch(e){console.error('❌ Registrierung:',e);} });
client.on('interactionCreate',async i=>{
 if(!i.isChatInputCommand()) return;
 if(i.commandName==='ping'){await i.reply({content:`🏓 Pong! **${client.ws.ping}ms**`});return;}
 if(i.commandName!=='personal') return;
 if(!i.memberPermissions.has(PermissionFlagsBits.ManageRoles)){await i.reply({content:'❌ Du hast keine Berechtigung für die Personalverwaltung.',ephemeral:true});return;}
 const sub=i.options.getSubcommand();
 if(sub==='einstellen') return personalEinstellen(i);
 if(sub==='entlassen') return personalEntlassen(i);
 if(sub==='uprank') return personalUprank(i);
});

async function rolleFinden(guild,name){ return guild.roles.cache.find(r=>r.name===name); }
async function hierarchiePruefen(interaction,rollen){ const bot=await interaction.guild.members.fetchMe(); for(const r of rollen){if(r.position>=bot.roles.highest.position)return `❌ Ich kann die Rolle **${r.name}** nicht verwalten. Bitte verschiebe meine Bot-Rolle darüber.`;} return null; }
async function alteArmyRollenEntfernen(mitglied,guild,botMember,reason){ for(const name of [...armyRaenge,...zusatzRollen]){const r=await rolleFinden(guild,name); if(r&&mitglied.roles.cache.has(r.id)&&!r.managed&&r.position<botMember.roles.highest.position) await mitglied.roles.remove(r,reason);} }

async function personalEinstellen(i){
 const user=i.options.getUser('mitglied'), icName=i.options.getString('ic_name').trim(), rang=i.options.getString('rang');
 let m; try{m=await i.guild.members.fetch(user.id);}catch(e){await i.reply({content:'❌ Das Mitglied konnte nicht geladen werden.',ephemeral:true});return;}
 const p=personalLaden(); if(p.personal.some(x=>x.discordId===user.id)){const x=p.personal.find(x=>x.discordId===user.id);await i.reply({content:`❌ Dieses Mitglied ist bereits eingestellt.\n🪪 DN: **${x.dienstnummer}**\n⭐ Rang: **${x.rang}**`,ephemeral:true});return;}
 const rr=await rolleFinden(i.guild,rang); if(!rr){await i.reply({content:`❌ Rangrolle **${rang}** nicht gefunden.`,ephemeral:true});return;}
 const dn=dienstnummerEinstellen(p,rang); if(!dn){await i.reply({content:`❌ Für **${rang}** ist keine Dienstnummer mehr verfügbar.`,ephemeral:true});return;}
 const names=zusatzRollenFuerRang(rang), roles=[]; for(const n of names){const r=await rolleFinden(i.guild,n);if(!r){await i.reply({content:`❌ Rolle **${n}** nicht gefunden.`,ephemeral:true});return;}roles.push(r);} if(!roles.some(r=>r.id===rr.id))roles.push(rr);
 const err=await hierarchiePruefen(i,roles);if(err){await i.reply({content:err,ephemeral:true});return;}
 const oldName=m.nickname||user.globalName||user.username; await i.deferReply(); const bot=await i.guild.members.fetchMe();
 try{await alteArmyRollenEntfernen(m,i.guild,bot,'U.S.Army Personal-Einstellung');for(const r of roles)await m.roles.add(r,'U.S.Army Personal-Einstellung');}catch(e){console.error(e);await i.editReply({content:'❌ Fehler bei der Rollenvergabe. Bitte Rollen-Hierarchie prüfen.'});return;}
 let nick=`[ARMY-${dn}] ${icName}`; if(nick.length>32)nick=nick.slice(0,32);try{await m.setNickname(nick,'U.S.Army Personal-Einstellung');}catch(e){console.warn(e.message);}
 const now=new Date();p.personal.push({discordId:user.id,discordName:user.username,alterDiscordName:oldName,icName,rang,dienstnummer:dn,eingestelltVon:i.user.id,datum:now.toISOString()}); if(!personalSpeichern(p)){await i.editReply({content:'❌ personal.json konnte nicht gespeichert werden.'});return;}
 const e=new EmbedBuilder().setTitle('🇺🇸 U.S.Army | Personal eingestellt').setDescription(`👤 <@${user.id}> wurde erfolgreich bei der U.S.Army eingestellt.`).addFields({name:'🪪 Dienstnummer',value:`**${dn}**`,inline:true},{name:'⭐ Rang',value:`**${rang}**`,inline:true},{name:'👤 IC Name',value:`**${icName}**`,inline:true},{name:'🎮 Discord',value:`**${nick}**`,inline:true},{name:'👮 Eingestellt von',value:`<@${i.user.id}>`,inline:true},{name:'📅 Datum',value:`<t:${Math.floor(now.getTime()/1000)}:F>`,inline:true}).setTimestamp();await i.editReply({embeds:[e]});
}

async function personalEntlassen(i){
 const user=i.options.getUser('mitglied'), ic=i.options.getString('ic_name').trim(), grund=i.options.getString('grund').trim(); let m;try{m=await i.guild.members.fetch(user.id);}catch(e){await i.reply({content:'❌ Das Mitglied konnte nicht geladen werden.',ephemeral:true});return;}
 const p=personalLaden(), entry=p.personal.find(x=>x.discordId===user.id);if(!entry){await i.reply({content:'❌ Dieses Mitglied befindet sich nicht in der Personalverwaltung.',ephemeral:true});return;} await i.deferReply();
 const burger=await rolleFinden(i.guild,'Bürger');if(!burger){await i.editReply({content:'❌ Die Rolle **Bürger** wurde nicht gefunden.'});return;} const bot=await i.guild.members.fetchMe();
 try{for(const [,r] of m.roles.cache){if(r.id===i.guild.id||r.id===burger.id||r.managed)continue;if(r.position<bot.roles.highest.position)await m.roles.remove(r,'U.S.Army Personal-Entlassung');}if(!m.roles.cache.has(burger.id)){if(burger.position>=bot.roles.highest.position){await i.editReply({content:'❌ Die Rolle **Bürger** liegt über meiner Bot-Rolle.'});return;}await m.roles.add(burger,'U.S.Army Personal-Entlassung');}}catch(e){console.error(e);await i.editReply({content:'❌ Fehler beim Entfernen der Rollen.'});return;}
 const old=entry.alterDiscordName||entry.discordName||user.globalName||user.username;try{await m.setNickname(old,'U.S.Army Personal-Entlassung');}catch(e){console.warn(e.message);}p.personal=p.personal.filter(x=>x.discordId!==user.id);if(!personalSpeichern(p)){await i.editReply({content:'❌ personal.json konnte nicht gespeichert werden.'});return;}
 const now=new Date(),e=new EmbedBuilder().setTitle('🚨 Entlassung').setDescription(`👤 <@${user.id}> wurde aus der Army entlassen.`).addFields({name:'🎮 Discord',value:`**${user.username}**`,inline:true},{name:'🎭 IC Name',value:`**${ic}**`,inline:true},{name:'🪪 Dienstnummer',value:`**${entry.dienstnummer||'Nicht angegeben'}**`,inline:true},{name:'⚠️ Grund der Kündigung',value:`**${grund}**`,inline:false},{name:'👋 Gekündigt von',value:`<@${i.user.id}>`,inline:false},{name:'📅 Datum',value:`<t:${Math.floor(now.getTime()/1000)}:F>`,inline:false}).setTimestamp().setFooter({text:'US-Army | ExodusV'});if(ARMY_BILD_URL)e.setImage(ARMY_BILD_URL);await i.editReply({embeds:[e]});
}

async function personalUprank(i){
 const user=i.options.getUser('mitglied'), oldRank=i.options.getString('alter_rang'), newRank=i.options.getString('neuer_rang'), grund=i.options.getString('grund').trim();if(oldRank===newRank){await i.reply({content:'❌ Alter und neuer Rang dürfen nicht identisch sein.',ephemeral:true});return;}
 let m;try{m=await i.guild.members.fetch(user.id);}catch(e){await i.reply({content:'❌ Das Mitglied konnte nicht geladen werden.',ephemeral:true});return;}
 const p=personalLaden(),entry=p.personal.find(x=>x.discordId===user.id);if(!entry){await i.reply({content:'❌ Dieses Mitglied befindet sich nicht in der Personalverwaltung.',ephemeral:true});return;}if(entry.rang!==oldRank){await i.reply({content:`❌ Gespeicherter Rang: **${entry.rang}**. Ausgewählt: **${oldRank}**.`,ephemeral:true});return;}
 const oldRole=await rolleFinden(i.guild,oldRank),newRole=await rolleFinden(i.guild,newRank);if(!oldRole||!newRole){await i.reply({content:'❌ Alte oder neue Rangrolle wurde nicht gefunden.',ephemeral:true});return;}
 const roles=[];for(const n of zusatzRollenFuerRang(newRank)){const r=await rolleFinden(i.guild,n);if(!r){await i.reply({content:`❌ Rolle **${n}** nicht gefunden.`,ephemeral:true});return;}roles.push(r);}if(!roles.some(r=>r.id===newRole.id))roles.push(newRole);const err=await hierarchiePruefen(i,roles);if(err){await i.reply({content:err,ephemeral:true});return;}
 await i.deferReply();
 const dn=dienstnummerUprank(p,newRank,entry.dienstnummer);if(!dn){await i.editReply({content:`❌ Der Rang **${newRank}** ist voll. Es ist keine freie Dienstnummer für diesen Rang verfügbar. Der Uprank wurde **nicht durchgeführt**.`});return;}
 const bot=await i.guild.members.fetchMe();try{await alteArmyRollenEntfernen(m,i.guild,bot,'U.S.Army Personal-Uprank');for(const r of roles)await m.roles.add(r,'U.S.Army Personal-Uprank');}catch(e){console.error(e);await i.editReply({content:'❌ Fehler beim Ändern der Rollen. Bitte Rollen-Hierarchie prüfen.'});return;}
 let nick=`[ARMY-${dn}] ${entry.icName}`;if(nick.length>32)nick=nick.slice(0,32);try{await m.setNickname(nick,'U.S.Army Personal-Uprank');}catch(e){console.warn(e.message);}
 const now=new Date();entry.rang=newRank;entry.dienstnummer=dn;entry.uprankVon=i.user.id;entry.uprankGrund=grund;entry.letzterUprank=now.toISOString();if(!personalSpeichern(p)){await i.editReply({content:'❌ personal.json konnte nicht gespeichert werden.'});return;}
 const e=new EmbedBuilder().setTitle('⬆️ Uprank').setDescription(`👤 <@${user.id}> wurde befördert!`).addFields({name:'📉 Alter Rang',value:`**${oldRank}**`,inline:true},{name:'📈 Neuer Rang',value:`**${newRank}**`,inline:true},{name:'🪪 Neue DN',value:`**${dn}**`,inline:true},{name:'📝 Grund',value:`**${grund}**`,inline:false},{name:'👤 Befördert von',value:`<@${i.user.id}>`,inline:false},{name:'📅 Datum',value:`<t:${Math.floor(now.getTime()/1000)}:F>`,inline:false}).setTimestamp().setFooter({text:'US-Army | ExodusV'});if(ARMY_BILD_URL)e.setImage(ARMY_BILD_URL);await i.editReply({embeds:[e]});
}

client.on('error',e=>console.error('❌ Discord Client Fehler:',e));
if(!process.env.DISCORD_TOKEN){console.error('❌ DISCORD_TOKEN wurde nicht gefunden!');process.exit(1);}
client.login(process.env.DISCORD_TOKEN);
