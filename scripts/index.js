// @ts-check

import { world, system, Player, CustomCommandOrigin, CustomCommandStatus, CommandPermissionLevel } from '@minecraft/server';
import config from './config.js';

const r = "§r";

const teamColors = {
    aqua: "§b",
    black: "§0",
    blue: "§9",
    dark_aqua: "§3",
    dark_blue: "§1",
    dark_grey: "§8",
    dark_green: "§2",
    dark_purple: "§5",
    dark_red: "§4",
    gold: "§6",
    grey: "§7",
    green: "§a",
    light_purple: "§d",
    red: "§c",
    white: "§f",
    yellow: "§e"
};


/**
 * @param { Player } sender
 * @param { string } message
 */
const teamChatFunc = function(sender, message){
    const team = Object.keys(teamColors).find(tag => sender.hasTag(tag));

    if(team){
        const color = teamColors[team];
        for(const player of world.getPlayers()){
            if(player.hasTag(team)){
                player.sendMessage(`-> ${color}[${team}] §r<${color}${sender.name}§r> ${message.replace(config.teamChatPrefix, "")}`);
            }
        }
    }else{
        sender.sendMessage("§cチームに所属していないため、チームチャットは利用できません！");
    }
};

system.runInterval(()=>{
    for(const player of world.getPlayers()){
        const team = Object.keys(teamColors).find(tag => player.hasTag(tag));

        if(team){
            const color = teamColors[team];
            player.nameTag = color + player.name + r;
        }else{
            player.nameTag = player.name;
        }
    }
},20);

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { initialSpawn, player } = ev;
    
    if(initialSpawn == true){
        player.setDynamicProperty("AutoTeamChat", false);
    }
});

system.beforeEvents.startup.subscribe((ev) => {
    /**
     * @param {string} name 
     * @param {string} description 
     * @param {(origin: CustomCommandOrigin, ...args: any[]) => { status: CustomCommandStatus }} callback 
     */
    const registerCommand = function(name, description, callback) {
        ev.customCommandRegistry.registerCommand(
            {
                name,
                description,
                permissionLevel: CommandPermissionLevel.Any,
            },
            callback
        );
    };

    registerCommand(
        "team:chat",
        "チームチャットの設定を切り替えます",
        autoTeamChat
    );
});

/**
 * @param {CustomCommandOrigin} origin
 * @returns {{ status: CustomCommandStatus, message: string }}
 */
const autoTeamChat = function(origin){
    if(origin.sourceEntity instanceof Player){
        const player = origin.sourceEntity;
        const autoTeamChat = player.getDynamicProperty("AutoTeamChat");

        if(autoTeamChat){
            player.setDynamicProperty("AutoTeamChat", false);
            return { status: CustomCommandStatus.Success, message: `§aチームチャットの設定を切り替えました\n§6現在の設定:手動`};
        }else{
            player.setDynamicProperty("AutoTeamChat", true);
            return { status: CustomCommandStatus.Success, message: `§aチームチャットの設定を切り替えました\n§6現在の設定:自動`};
        }
    }else{
        return { status: CustomCommandStatus.Failure, message: `このコマンドはプレイヤー以外に対して実行できません`};
    }
}

world.beforeEvents.chatSend.subscribe((ev) => {
    const { sender, message } = ev;
    const autoTeamChat = sender.getDynamicProperty("AutoTeamChat");
    ev.cancel = true;

    //自動
    if(autoTeamChat){
        if(message.startsWith(config.teamChatPrefix)){
            world.sendMessage("<" + sender.nameTag + "> " + message.replace(config.teamChatPrefix,""));
        }else{
            teamChatFunc(sender, message);
        }
    }
    
    //手動
    else{
        if(message.startsWith(config.teamChatPrefix)){
            teamChatFunc(sender, message);
        }else{
            world.sendMessage("<" + sender.nameTag + "> " + message.replace(config.teamChatPrefix,""));
        }
    }
    
});