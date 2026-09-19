require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    AttachmentBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// BOT
// =====================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN fehlt in der .env Datei!");
    process.exit(1);
}

// =====================================================
// DATEIEN
// =====================================================

const PERSONAL_DATEI = path.join(__dirname, "personal.json");
const ARMY_BILD_PFAD = path.join(__dirname, "army.png");

if (!fs.existsSync(PERSONAL_DATEI)) {
    fs.writeFileSync(
        PERSONAL_DATEI,
        JSON.stringify({ personal: [] }, null, 2)
    );
}

function personalLaden() {
    try {
        const daten = JSON.parse(
            fs.readFileSync(PERSONAL_DATEI, "utf8")
        );

        if (Array.isArray(daten)) {
            return daten;
        }

        if (Array.isArray(daten.personal)) {
            return daten.personal;
        }

        return [];
    } catch (error) {
        console.error("❌ Fehler beim Laden von personal.json:", error);
        return [];
    }
}

function personalSpeichern(personal) {
    fs.writeFileSync(
        PERSONAL_DATEI,
        JSON.stringify({ personal }, null, 2)
    );
}

// =====================================================
// RÄNGE
// =====================================================

const RANG_NAMEN = {
    21: "General of the Army",
    20: "General",
    19: "Lieutnant General",
    18: "Captain",
    17: "First Lieutenant",
    16: "Second Lieutenant",
    15: "Chief Warrant Officer III",
    14: "Chief Warrant Officer II",
    13: "Chief Warrant Officer I",
    12: "Warrant Officer II",
    11: "Warrant Officer I",
    10: "Command Sergeant Major",
    9: "First Sergeant",
    8: "Master Sergeant",
    7: "Sergeant First Class",
    6: "Staff Sergeant",
    5: "Sergeant",
    4: "Corporal",
    3: "Specialist",
    2: "Private First Class",
    1: "Private Second Class"
};

// =====================================================
// EXAKTE DISCORD-ROLLENNAMEN
// =====================================================

const RANG_ROLLEN = {
    21: "➛[21] General of the Army",
    20: "➛[20] General",
    19: "➛[19] Lieutnant General",
    18: "➛[18] Captain",
    17: "➛[17] First Lieutenant",
    16: "➛[16] Second Lieutenant",
    15: "➛[15] Chief Warrant Officer III",
    14: "➛[14] Chief Warrant Officer II",
    13: "➛[13] Chief Warrant Officer I",
    12: "➛[12] Warrant Officer II",
    11: "➛[11] Warrant Officer I",
    10: "➛[10] Command Sergeant Major",
    9: "➛[09] First Sergeant",
    8: "➛[08] Master Sergeant",
    7: "➛[07] Sergeant First Class",
    6: "➛[06] Staff Sergeant",
    5: "➛[05] Sergeant",
    4: "➛[04] Corporal",
    3: "➛[03] Specialist",
    2: "➛[02] Private First Class",
    1: "➛[01] Private Second Class"
};

const EXTRA_ROLLEN = {
    army: "➥ U.S Army",

    abteilungen:
        "▁▁▁▁▁🢫Abteilungen🢪▁▁▁▁▁▁",

    mannschaft:
        "▁▁▁▁▁🢫Mannschaft🢪▁▁▁▁▁▁",

    unteroffiziere:
        "▁▁▁▁▁🢫Unteroffiziere🢪▁▁▁▁▁▁",

    leutnant:
        "▁▁▁▁▁🢫Leutnant🢪▁▁▁▁▁▁",

    hauptleute:
        "▁▁▁▁▁🢫Hauptleute🢪▁▁▁▁▁▁",

    fieldGradeOfficer:
        "▁▁▁▁▁🢫Field Grade Officer🢪▁▁▁▁▁▁",

    general:
        "▁▁▁▁▁General🢪▁▁▁▁▁▁",

    buerger:
        "➥ Bürger"
};

// =====================================================
// ZUSATZROLLEN JE NACH RANG
// =====================================================

function extraRollenFuerRang(rang) {
    rang = Number(rang);

    const rollen = [
        EXTRA_ROLLEN.army,
        EXTRA_ROLLEN.abteilungen
    ];

    if (rang >= 19) {
        rollen.push(
            EXTRA_ROLLEN.mannschaft,
            EXTRA_ROLLEN.unteroffiziere,
            EXTRA_ROLLEN.leutnant,
            EXTRA_ROLLEN.hauptleute,
            EXTRA_ROLLEN.fieldGradeOfficer,
            EXTRA_ROLLEN.general
        );
    } else if (rang >= 16) {
        rollen.push(
            EXTRA_ROLLEN.mannschaft,
            EXTRA_ROLLEN.unteroffiziere,
            EXTRA_ROLLEN.leutnant,
            EXTRA_ROLLEN.hauptleute,
            EXTRA_ROLLEN.fieldGradeOfficer
        );
    } else if (rang >= 14) {
        rollen.push(
            EXTRA_ROLLEN.mannschaft,
            EXTRA_ROLLEN.unteroffiziere,
            EXTRA_ROLLEN.leutnant,
            EXTRA_ROLLEN.hauptleute
        );
    } else if (rang >= 12) {
        rollen.push(
            EXTRA_ROLLEN.mannschaft,
            EXTRA_ROLLEN.unteroffiziere,
            EXTRA_ROLLEN.leutnant
        );
    } else if (rang >= 5) {
        rollen.push(
            EXTRA_ROLLEN.mannschaft,
            EXTRA_ROLLEN.unteroffiziere
        );
    } else {
        rollen.push(
            EXTRA_ROLLEN.mannschaft
        );
    }

    return rollen;
}

// =====================================================
// ROLLE SUCHEN
// =====================================================

function rolleFinden(guild, rollenName) {
    return guild.roles.cache.find(
        role => role.name === rollenName
    );
}

// =====================================================
// ALLE ARMY-ROLLEN
// =====================================================

function alleArmyRollen() {
    return [
        ...Object.values(RANG_ROLLEN),
        ...Object.values(EXTRA_ROLLEN)
    ];
}

// =====================================================
// ALTE ARMY-ROLLEN ENTFERNEN
// =====================================================

async function alteArmyRollenEntfernen(member) {
    const armyRollen = alleArmyRollen();

    for (const role of member.roles.cache.values()) {
        if (
            armyRollen.includes(role.name) &&
            role.editable
        ) {
            try {
                await member.roles.remove(role);
            } catch (error) {
                console.error(
                    `❌ Konnte Rolle "${role.name}" nicht entfernen:`,
                    error.message
                );
            }
        }
    }
}

// =====================================================
// ROLLEN FÜR EINEN RANG SETZEN
// =====================================================

async function rollenFuerRangSetzen(member, rang) {
    rang = Number(rang);

    const benoetigteRollen = [
        RANG_ROLLEN[rang],
        ...extraRollenFuerRang(rang)
    ];

    // Alte Army-Rollen entfernen
    await alteArmyRollenEntfernen(member);

    // Bürger entfernen
    const buerger = rolleFinden(
        member.guild,
        EXTRA_ROLLEN.buerger
    );

    if (
        buerger &&
        member.roles.cache.has(buerger.id) &&
        buerger.editable
    ) {
        try {
            await member.roles.remove(buerger);
        } catch (error) {
            console.error(
                "❌ Bürger-Rolle konnte nicht entfernt werden:",
                error.message
            );
        }
    }

    // Neue Rollen hinzufügen
    for (const rollenName of benoetigteRollen) {
        const rolle = rolleFinden(
            member.guild,
            rollenName
        );

        if (!rolle) {
            console.warn(
                `⚠️ Rolle nicht gefunden: ${rollenName}`
            );
            continue;
        }

        if (!rolle.editable) {
            console.warn(
                `⚠️ Rolle kann nicht vergeben werden: ${rollenName}`
            );
            continue;
        }

        if (!member.roles.cache.has(rolle.id)) {
            try {
                await member.roles.add(rolle);
            } catch (error) {
                console.error(
                    `❌ Rolle "${rollenName}" konnte nicht vergeben werden:`,
                    error.message
                );
            }
        }
    }
}

// =====================================================
// DIENSTNUMMER
// =====================================================

function dienstnummernImEinsatz(personal, eigeneDiscordID = null) {
    return personal
        .filter(person => person.discordId !== eigeneDiscordID)
        .map(person => String(person.dienstnummer).padStart(2, "0"));
}

function dienstnummerErmitteln(personal, rang) {
    rang = Number(rang);

    const benutzt = dienstnummernImEinsatz(personal);

    // Rang 21 -> 01 / 02
    if (rang === 21) {
        if (!benutzt.includes("01")) return "01";
        if (!benutzt.includes("02")) return "02";
        return null;
    }

    // Rang 20 -> 03 / 04
    if (rang === 20) {
        if (!benutzt.includes("03")) return "03";
        if (!benutzt.includes("04")) return "04";
        return null;
    }

    // Rang 19 -> 05 / 06
    if (rang === 19) {
        if (!benutzt.includes("05")) return "05";
        if (!benutzt.includes("06")) return "06";
        return null;
    }

    // Rang 18-1 -> 07-99
    const freieNummern = [];

    for (let i = 7; i <= 99; i++) {
        const nummer = String(i).padStart(2, "0");

        if (!benutzt.includes(nummer)) {
            freieNummern.push(nummer);
        }
    }

    if (freieNummern.length === 0) {
        return null;
    }

    return freieNummern[
        Math.floor(Math.random() * freieNummern.length)
    ];
}

// =====================================================
// DIENSTNUMMER FÜR UPRANK
// =====================================================

function dienstnummerFuerUprank(
    personal,
    rang,
    eigeneDiscordID
) {
    rang = Number(rang);

    const benutzt = dienstnummernImEinsatz(
        personal,
        eigeneDiscordID
    );

    if (rang === 21) {
        if (!benutzt.includes("01")) return "01";
        if (!benutzt.includes("02")) return "02";
        return null;
    }

    if (rang === 20) {
        if (!benutzt.includes("03")) return "03";
        if (!benutzt.includes("04")) return "04";
        return null;
    }

    if (rang === 19) {
        if (!benutzt.includes("05")) return "05";
        if (!benutzt.includes("06")) return "06";
        return null;
    }

    const freieNummern = [];

    for (let i = 7; i <= 99; i++) {
        const nummer = String(i).padStart(2, "0");

        if (!benutzt.includes(nummer)) {
            freieNummern.push(nummer);
        }
    }

    if (freieNummern.length === 0) {
        return null;
    }

    return freieNummern[
        Math.floor(Math.random() * freieNummern.length)
    ];
}

// =====================================================
// NICKNAME
// =====================================================

function armyNickname(dienstnummer, icName) {
    let nickname = `[ARMY-${dienstnummer}] ${icName}`;

    // Discord erlaubt maximal 32 Zeichen
    if (nickname.length > 32) {
        nickname = nickname.substring(0, 32);
    }

    return nickname;
}

// =====================================================
// ARMY BILD
// =====================================================

function armyBildErstellen() {
    if (!fs.existsSync(ARMY_BILD_PFAD)) {
        console.warn(
            "⚠️ army.png wurde nicht gefunden!"
        );
        return null;
    }

    return new AttachmentBuilder(
        ARMY_BILD_PFAD,
        {
            name: "army.png"
        }
    );
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const rangChoices = Object.entries(RANG_NAMEN).map(
    ([rang, name]) => ({
        name: `[${String(rang).padStart(2, "0")}] ${name}`,
        value: rang
    })
);

const commands = [

    // =========================
    // PING
    // =========================

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Zeigt die Bot-Latenz an."),

    // =========================
    // PERSONAL
    // =========================

    new SlashCommandBuilder()
        .setName("personal")
        .setDescription("Verwalte das U.S.Army Personal.")

        // =========================
        // EINSTELLEN
        // =========================

        .addSubcommand(subcommand =>
            subcommand
                .setName("einstellen")
                .setDescription("Stellt ein neues Personalmitglied ein.")

                .addUserOption(option =>
                    option
                        .setName("mitglied")
                        .setDescription("Discord-Mitglied")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("ic_name")
                        .setDescription("IC-Name des Personalmitglieds")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("rang")
                        .setDescription("Rang des Personalmitglieds")
                        .setRequired(true)
                        .addChoices(...rangChoices)
                )
        )

        // =========================
        // ENTLASSEN
        // =========================

        .addSubcommand(subcommand =>
            subcommand
                .setName("entlassen")
                .setDescription("Entlässt ein Personalmitglied.")

                .addUserOption(option =>
                    option
                        .setName("mitglied")
                        .setDescription("Discord-Mitglied")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("ic_name")
                        .setDescription("IC-Name")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("grund")
                        .setDescription("Grund der Entlassung")
                        .setRequired(true)
                )
        )

        // =========================
        // UPRANK
        // =========================

        .addSubcommand(subcommand =>
            subcommand
                .setName("uprank")
                .setDescription("Befördert ein Personalmitglied.")

                .addUserOption(option =>
                    option
                        .setName("mitglied")
                        .setDescription("Discord-Mitglied")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("alter_rang")
                        .setDescription("Bisheriger Rang")
                        .setRequired(true)
                        .addChoices(...rangChoices)
                )

                .addStringOption(option =>
                    option
                        .setName("neuer_rang")
                        .setDescription("Neuer Rang")
                        .setRequired(true)
                        .addChoices(...rangChoices)
                )

                .addStringOption(option =>
                    option
                        .setName("grund")
                        .setDescription("Grund der Beförderung")
                        .setRequired(true)
                )
        )
];

// =====================================================
// COMMANDS REGISTRIEREN
// =====================================================

const rest = new REST({ version: "10" })
    .setToken(TOKEN);

// =====================================================
// BOT READY
// =====================================================

client.once("ready", async () => {

    console.log("");
    console.log("======================================");
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`🆔 Bot-ID: ${client.user.id}`);
    console.log("======================================");
    console.log("");

    try {
        console.log("🔄 Registriere Slash-Commands...");

        await rest.put(
            Routes.applicationCommands(
                client.user.id
            ),
            {
                body: commands.map(command =>
                    command.toJSON()
                )
            }
        );

        console.log("✅ Slash-Commands registriert.");
        console.log("");
    } catch (error) {
        console.error(
            "❌ Fehler beim Registrieren der Commands:",
            error
        );
    }
});

// =====================================================
// INTERACTIONS
// =====================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) {
        return;
    }

    // =================================================
    // PING
    // =================================================

    if (interaction.commandName === "ping") {

        const ping =
            Date.now() - interaction.createdTimestamp;

        await interaction.reply(
            `🏓 Pong!\nLatenz: **${ping}ms**`
        );

        return;
    }

    // =================================================
    // PERSONAL
    // =================================================

    if (interaction.commandName !== "personal") {
        return;
    }

    const subcommand =
        interaction.options.getSubcommand();

    // Für längere Discord-Aktionen
    await interaction.deferReply();

    try {

        const guild = interaction.guild;

        if (!guild) {
            await interaction.editReply(
                "❌ Dieser Command kann nur auf einem Server verwendet werden."
            );
            return;
        }

        // =================================================
        // PERSONAL EINSTELLEN
        // =================================================

        if (subcommand === "einstellen") {

            const user =
                interaction.options.getUser("mitglied");

            const icName =
                interaction.options.getString("ic_name");

            const rang =
                Number(
                    interaction.options.getString("rang")
                );

            let personal = personalLaden();

            // Mitglied laden
            let member;

            try {
                member =
                    await guild.members.fetch(user.id);
            } catch {
                await interaction.editReply(
                    "❌ Das Mitglied konnte nicht geladen werden."
                );
                return;
            }

            // Prüfen, ob bereits Personal
            const bereitsPersonal =
                personal.find(
                    person =>
                        person.discordId === user.id
                );

            if (bereitsPersonal) {
                await interaction.editReply(
                    `❌ ${user} ist bereits beim U.S.Army Personal eingetragen.\n` +
                    `Dienstnummer: **${bereitsPersonal.dienstnummer}**`
                );
                return;
            }

            // Rang prüfen
            if (!RANG_ROLLEN[rang]) {
                await interaction.editReply(
                    "❌ Dieser Rang ist ungültig."
                );
                return;
            }

            // Dienstnummer ermitteln
            const dienstnummer =
                dienstnummerErmitteln(
                    personal,
                    rang
                );

            if (!dienstnummer) {

                let text;

                if (rang === 21) {
                    text =
                        "❌ Der Rang **21 – General of the Army** ist bereits voll.\n" +
                        "Es können maximal **2 Personen** diesen Rang besitzen.";
                } else if (rang === 20) {
                    text =
                        "❌ Der Rang **20 – General** ist bereits voll.\n" +
                        "Es können maximal **2 Personen** diesen Rang besitzen.";
                } else if (rang === 19) {
                    text =
                        "❌ Der Rang **19 – Lieutnant General** ist bereits voll.\n" +
                        "Es können maximal **2 Personen** diesen Rang besitzen.";
                } else {
                    text =
                        "❌ Es ist keine freie Dienstnummer mehr verfügbar.";
                }

                await interaction.editReply(text);
                return;
            }

            // Alte Rollen entfernen + neue Rollen setzen
            await rollenFuerRangSetzen(
                member,
                rang
            );

            // Originalen Nickname speichern
            const originalNickname =
                member.nickname || member.user.username;

            // Neuer Nickname
            const neuerNickname =
                armyNickname(
                    dienstnummer,
                    icName
                );

            if (member.manageable) {
                try {
                    await member.setNickname(
                        neuerNickname
                    );
                } catch (error) {
                    console.error(
                        "❌ Nickname konnte nicht geändert werden:",
                        error.message
                    );
                }
            }

            // Personal speichern
            const neuerEintrag = {
                discordId: user.id,
                discordTag: user.tag,
                icName: icName,
                rang: rang,
                rangName: RANG_NAMEN[rang],
                dienstnummer: dienstnummer,
                originalNickname: originalNickname,
                eingestelltVon: interaction.user.id,
                eingestelltAm: new Date().toISOString()
            };

            personal.push(neuerEintrag);

            personalSpeichern(personal);

            // Embed
            const embed =
                new EmbedBuilder()
                    .setTitle("🇺🇸 Personal eingestellt")
                    .setDescription(
                        `${user} wurde erfolgreich in das **U.S.Army** Personal aufgenommen.`
                    )
                    .addFields(
                        {
                            name: "🪪 Dienstnummer",
                            value: `**${dienstnummer}**`,
                            inline: true
                        },
                        {
                            name: "🎖️ Rang",
                            value:
                                `**[${String(rang).padStart(2, "0")}] ${RANG_NAMEN[rang]}**`,
                            inline: true
                        },
                        {
                            name: "👤 IC-Name",
                            value: `**${icName}**`,
                            inline: true
                        },
                        {
                            name: "💬 Discord",
                            value: `${user}`,
                            inline: true
                        },
                        {
                            name: "👮 Eingestellt von",
                            value: `${interaction.user}`,
                            inline: true
                        },
                        {
                            name: "📅 Datum",
                            value:
                                `<t:${Math.floor(Date.now() / 1000)}:F>`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "US-Army | ExodusV"
                    })
                    .setTimestamp();

            const armyBild =
                armyBildErstellen();

            if (armyBild) {
                embed.setImage(
                    "attachment://army.png"
                );
            }

            if (armyBild) {
                await interaction.editReply({
                    embeds: [embed],
                    files: [armyBild]
                });
            } else {
                await interaction.editReply({
                    embeds: [embed]
                });
            }

            return;
        }

        // =================================================
        // PERSONAL ENTLASSEN
        // =================================================

        if (subcommand === "entlassen") {

            const user =
                interaction.options.getUser("mitglied");

            const icName =
                interaction.options.getString("ic_name");

            const grund =
                interaction.options.getString("grund");

            let personal = personalLaden();

            let member;

            try {
                member =
                    await guild.members.fetch(user.id);
            } catch {
                await interaction.editReply(
                    "❌ Das Mitglied konnte nicht geladen werden."
                );
                return;
            }

            const eintrag =
                personal.find(
                    person =>
                        person.discordId === user.id
                );

            if (!eintrag) {
                await interaction.editReply(
                    "❌ Dieses Mitglied befindet sich nicht im U.S.Army Personal."
                );
                return;
            }

            // Alle Rollen entfernen außer @everyone
            for (const role of member.roles.cache.values()) {

                if (
                    role.id === guild.roles.everyone.id
                ) {
                    continue;
                }

                if (!role.editable) {
                    continue;
                }

                try {
                    await member.roles.remove(role);
                } catch (error) {
                    console.error(
                        `❌ Rolle "${role.name}" konnte nicht entfernt werden:`,
                        error.message
                    );
                }
            }

            // Bürger-Rolle geben
            const buerger =
                rolleFinden(
                    guild,
                    EXTRA_ROLLEN.buerger
                );

            if (buerger) {

                if (buerger.editable) {

                    try {
                        await member.roles.add(
                            buerger
                        );
                    } catch (error) {
                        console.error(
                            "❌ Bürger-Rolle konnte nicht vergeben werden:",
                            error.message
                        );
                    }

                } else {
                    console.warn(
                        "⚠️ Bürger-Rolle ist für den Bot nicht bearbeitbar."
                    );
                }

            } else {
                console.warn(
                    `⚠️ Rolle "${EXTRA_ROLLEN.buerger}" wurde nicht gefunden.`
                );
            }

            // Originalen Nickname wiederherstellen
            if (
                member.manageable &&
                eintrag.originalNickname
            ) {
                try {
                    await member.setNickname(
                        eintrag.originalNickname
                    );
                } catch (error) {
                    console.error(
                        "❌ Originaler Nickname konnte nicht wiederhergestellt werden:",
                        error.message
                    );
                }
            }

            // Personal entfernen
            personal =
                personal.filter(
                    person =>
                        person.discordId !== user.id
                );

            personalSpeichern(personal);

            // Embed
            const embed =
                new EmbedBuilder()
                    .setTitle("🚨 Entlassung")
                    .setDescription(
                        `${user} wurde aus dem **U.S.Army** Personal entlassen.`
                    )
                    .addFields(
                        {
                            name: "💬 Discord",
                            value: `${user}`,
                            inline: true
                        },
                        {
                            name: "👤 IC-Name",
                            value: `**${icName}**`,
                            inline: true
                        },
                        {
                            name: "🪪 Dienstnummer",
                            value:
                                `**${eintrag.dienstnummer}**`,
                            inline: true
                        },
                        {
                            name: "📋 Grund der Kündigung",
                            value: `**${grund}**`,
                            inline: false
                        },
                        {
                            name: "👮 Gekündigt von",
                            value: `${interaction.user}`,
                            inline: true
                        },
                        {
                            name: "📅 Datum",
                            value:
                                `<t:${Math.floor(Date.now() / 1000)}:F>`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "US-Army | ExodusV"
                    })
                    .setTimestamp();

            const armyBild =
                armyBildErstellen();

            if (armyBild) {
                embed.setImage(
                    "attachment://army.png"
                );
            }

            if (armyBild) {
                await interaction.editReply({
                    embeds: [embed],
                    files: [armyBild]
                });
            } else {
                await interaction.editReply({
                    embeds: [embed]
                });
            }

            return;
        }

        // =================================================
        // PERSONAL UPRANK
        // =================================================

        if (subcommand === "uprank") {

            const user =
                interaction.options.getUser("mitglied");

            const alterRang =
                Number(
                    interaction.options.getString("alter_rang")
                );

            const neuerRang =
                Number(
                    interaction.options.getString("neuer_rang")
                );

            const grund =
                interaction.options.getString("grund");

            let personal = personalLaden();

            let member;

            try {
                member =
                    await guild.members.fetch(user.id);
            } catch {
                await interaction.editReply(
                    "❌ Das Mitglied konnte nicht geladen werden."
                );
                return;
            }

            const eintrag =
                personal.find(
                    person =>
                        person.discordId === user.id
                );

            if (!eintrag) {
                await interaction.editReply(
                    "❌ Dieses Mitglied befindet sich nicht im U.S.Army Personal."
                );
                return;
            }

            // Prüfen, ob alter Rang stimmt
            if (
                Number(eintrag.rang) !==
                alterRang
            ) {
                await interaction.editReply(
                    `❌ Der gespeicherte Rang stimmt nicht mit deiner Auswahl überein.\n\n` +
                    `Gespeicherter Rang: **[${String(eintrag.rang).padStart(2, "0")}] ${eintrag.rangName}**`
                );
                return;
            }

            // Gleicher Rang?
            if (alterRang === neuerRang) {
                await interaction.editReply(
                    "❌ Der neue Rang ist identisch mit dem alten Rang."
                );
                return;
            }

            // Neue Dienstnummer
            const neueDienstnummer =
                dienstnummerFuerUprank(
                    personal,
                    neuerRang,
                    user.id
                );

            if (!neueDienstnummer) {

                let text;

                if (neuerRang === 21) {
                    text =
                        "❌ Der Rang **21 – General of the Army** ist bereits voll.";
                } else if (neuerRang === 20) {
                    text =
                        "❌ Der Rang **20 – General** ist bereits voll.";
                } else if (neuerRang === 19) {
                    text =
                        "❌ Der Rang **19 – Lieutnant General** ist bereits voll.";
                } else {
                    text =
                        "❌ Es ist keine freie Dienstnummer mehr verfügbar.";
                }

                await interaction.editReply(text);
                return;
            }

            // Rollen ändern
            await rollenFuerRangSetzen(
                member,
                neuerRang
            );

            // Nickname ändern
            const neuerNickname =
                armyNickname(
                    neueDienstnummer,
                    eintrag.icName
                );

            if (member.manageable) {
                try {
                    await member.setNickname(
                        neuerNickname
                    );
                } catch (error) {
                    console.error(
                        "❌ Nickname konnte nicht geändert werden:",
                        error.message
                    );
                }
            }

            // Daten aktualisieren
            eintrag.rang = neuerRang;
            eintrag.rangName =
                RANG_NAMEN[neuerRang];

            eintrag.dienstnummer =
                neueDienstnummer;

            eintrag.uprankVon =
                interaction.user.id;

            eintrag.uprankAm =
                new Date().toISOString();

            personalSpeichern(personal);

            // Embed
            const embed =
                new EmbedBuilder()
                    .setTitle("🎖️ Beförderung")
                    .setDescription(
                        `${user} wurde erfolgreich befördert.`
                    )
                    .addFields(
                        {
                            name: "👤 IC-Name",
                            value:
                                `**${eintrag.icName}**`,
                            inline: true
                        },
                        {
                            name: "🪪 Neue Dienstnummer",
                            value:
                                `**${neueDienstnummer}**`,
                            inline: true
                        },
                        {
                            name: "📉 Alter Rang",
                            value:
                                `**[${String(alterRang).padStart(2, "0")}] ${RANG_NAMEN[alterRang]}**`,
                            inline: false
                        },
                        {
                            name: "📈 Neuer Rang",
                            value:
                                `**[${String(neuerRang).padStart(2, "0")}] ${RANG_NAMEN[neuerRang]}**`,
                            inline: false
                        },
                        {
                            name: "📋 Grund",
                            value:
                                `**${grund}**`,
                            inline: false
                        },
                        {
                            name: "👮 Befördert von",
                            value:
                                `${interaction.user}`,
                            inline: true
                        },
                        {
                            name: "📅 Datum",
                            value:
                                `<t:${Math.floor(Date.now() / 1000)}:F>`,
                            inline: true
                        }
                    )
                    .setFooter({
                        text: "US-Army | ExodusV"
                    })
                    .setTimestamp();

            // Bei Uprank KEIN Bild
            await interaction.editReply({
                embeds: [embed]
            });

            return;
        }

    } catch (error) {

        console.error(
            "❌ Fehler bei der Interaction:",
            error
        );

        try {
            if (interaction.deferred) {
                await interaction.editReply(
                    "❌ Es ist ein Fehler aufgetreten. Bitte überprüfe die Bot-Konsole."
                );
            } else if (!interaction.replied) {
                await interaction.reply(
                    "❌ Es ist ein Fehler aufgetreten."
                );
            }
        } catch (replyError) {
            console.error(
                "❌ Fehler beim Senden der Fehlermeldung:",
                replyError
            );
        }
    }
});

// =====================================================
// FEHLER
// =====================================================

client.on("error", error => {
    console.error(
        "❌ Discord Client Fehler:",
        error
    );
});

process.on("unhandledRejection", error => {
    console.error(
        "❌ Unhandled Promise Rejection:",
        error
    );
});

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);
