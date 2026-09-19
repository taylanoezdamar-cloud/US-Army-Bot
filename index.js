const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
require("dotenv").config();

// ======================================================
// BOT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN fehlt in der .env");
    process.exit(1);
}

// ======================================================
// PERSONAL.JSON
// ======================================================

const PERSONAL_DATEI = path.join(__dirname, "personal.json");

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

        if (!Array.isArray(daten.personal)) {
            daten.personal = [];
        }

        return daten.personal;
    } catch (error) {
        console.error("❌ Fehler beim Laden von personal.json:", error);
        return [];
    }
}

function personalSpeichern(personal) {
    fs.writeFileSync(
        PERSONAL_DATEI,
        JSON.stringify(
            {
                personal
            },
            null,
            2
        )
    );
}

// ======================================================
// RÄNGE
// ======================================================

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

// ======================================================
// EXAKTE ROLLENNAMEN
// ======================================================

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
    US_ARMY: "➥ U.S Army",
    ABTEILUNGEN: "▁▁▁▁▁🢫Abteilungen🢪▁▁▁▁▁▁",
    MANNSCHAFT: "▁▁▁▁▁🢫Mannschaft🢪▁▁▁▁▁▁",
    UNTEROFFIZIERE: "▁▁▁▁▁🢫Unteroffiziere🢪▁▁▁▁▁▁",
    LEUTNANT: "▁▁▁▁▁🢫Leutnant🢪▁▁▁▁▁▁",
    HAUPTLEUTE: "▁▁▁▁▁🢫Hauptleute🢪▁▁▁▁▁▁",
    FIELD_GRADE_OFFICER: "▁▁▁▁▁🢫Field Grade Officer🢪▁▁▁▁▁▁",
    GENERAL: "▁▁▁▁▁General🢪▁▁▁▁▁▁",
    BURGER: "➥ Bürger"
};

// ======================================================
// EXTRA-ROLLEN NACH RANG
// ======================================================

function extraRollenFuerRang(rang) {
    const rollen = [
        EXTRA_ROLLEN.US_ARMY,
        EXTRA_ROLLEN.ABTEILUNGEN
    ];

    if (rang >= 19 && rang <= 21) {
        rollen.push(
            EXTRA_ROLLEN.MANNSCHAFT,
            EXTRA_ROLLEN.UNTEROFFIZIERE,
            EXTRA_ROLLEN.LEUTNANT,
            EXTRA_ROLLEN.HAUPTLEUTE,
            EXTRA_ROLLEN.FIELD_GRADE_OFFICER,
            EXTRA_ROLLEN.GENERAL
        );
    } else if (rang >= 16 && rang <= 18) {
        rollen.push(
            EXTRA_ROLLEN.MANNSCHAFT,
            EXTRA_ROLLEN.UNTEROFFIZIERE,
            EXTRA_ROLLEN.LEUTNANT,
            EXTRA_ROLLEN.HAUPTLEUTE,
            EXTRA_ROLLEN.FIELD_GRADE_OFFICER
        );
    } else if (rang >= 14 && rang <= 15) {
        rollen.push(
            EXTRA_ROLLEN.MANNSCHAFT,
            EXTRA_ROLLEN.UNTEROFFIZIERE,
            EXTRA_ROLLEN.LEUTNANT,
            EXTRA_ROLLEN.HAUPTLEUTE
        );
    } else if (rang >= 12 && rang <= 13) {
        rollen.push(
            EXTRA_ROLLEN.MANNSCHAFT,
            EXTRA_ROLLEN.UNTEROFFIZIERE,
            EXTRA_ROLLEN.LEUTNANT
        );
    } else if (rang >= 5 && rang <= 11) {
        rollen.push(
            EXTRA_ROLLEN.MANNSCHAFT,
            EXTRA_ROLLEN.UNTEROFFIZIERE
        );
    } else if (rang >= 1 && rang <= 4) {
        rollen.push(
            EXTRA_ROLLEN.MANNSCHAFT
        );
    }

    return rollen;
}

// ======================================================
// ROLLEN FINDEN
// ======================================================

function rolleFinden(guild, rollenName) {
    return guild.roles.cache.find(
        role => role.name === rollenName
    );
}

// ======================================================
// DIENSTNUMMER
// ======================================================

function dienstnummerErmitteln(rang, personal) {

    // Rang 21 = 01 / 02
    if (rang === 21) {
        const nummern = ["01", "02"];

        for (const nummer of nummern) {
            const belegt = personal.some(
                person => person.dienstnummer === nummer
            );

            if (!belegt) {
                return nummer;
            }
        }

        return null;
    }

    // Rang 20 = 03 / 04
    if (rang === 20) {
        const nummern = ["03", "04"];

        for (const nummer of nummern) {
            const belegt = personal.some(
                person => person.dienstnummer === nummer
            );

            if (!belegt) {
                return nummer;
            }
        }

        return null;
    }

    // Rang 19 = 05 / 06
    if (rang === 19) {
        const nummern = ["05", "06"];

        for (const nummer of nummern) {
            const belegt = personal.some(
                person => person.dienstnummer === nummer
            );

            if (!belegt) {
                return nummer;
            }
        }

        return null;
    }

    // Rang 18 bis 1 = 07 bis 99
    const freieNummern = [];

    for (let i = 7; i <= 99; i++) {
        const nummer = String(i).padStart(2, "0");

        const belegt = personal.some(
            person => person.dienstnummer === nummer
        );

        if (!belegt) {
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

// ======================================================
// DIENSTNUMMER FÜR UPRANK
// ======================================================

function dienstnummerFuerUprank(rang, personal, alteDienstnummer) {

    const anderePersonal = personal.filter(
        person => person.dienstnummer !== alteDienstnummer
    );

    return dienstnummerErmitteln(
        rang,
        anderePersonal
    );
}

// ======================================================
// ARMY BILD
// ======================================================

const ARMY_BILD_URL =
    "https://cdn.discordapp.com/attachments/1549718870691160115/1550820644034322503/image-3.png?ex=6aafb9c6&is=6aae6846&hm=7f7cf2f66aaa643aaefb3269cd026a730025890c88b003f5c913dc298da4ac8b";

// ======================================================
// ALLE ARMY-ROLLEN
// ======================================================

function alleArmyRollen() {
    return [
        ...Object.values(RANG_ROLLEN),
        ...Object.values(EXTRA_ROLLEN)
    ];
}

// ======================================================
// ARMY ROLLEN ENTFERNEN
// ======================================================

async function alteArmyRollenEntfernen(member) {

    const rollenNamen = alleArmyRollen();

    const entfernen = member.roles.cache.filter(
        role => rollenNamen.includes(role.name)
    );

    if (entfernen.size > 0) {
        await member.roles.remove(entfernen);
    }
}

// ======================================================
// ROLLEN FÜR EINEN RANG GEBEN
// ======================================================

async function rollenFuerRangSetzen(member, rang) {

    const rangRollenName = RANG_ROLLEN[rang];

    if (!rangRollenName) {
        throw new Error(
            `Keine Rangrolle für Rang ${rang} gefunden.`
        );
    }

    const rollenNamen = [
        rangRollenName,
        ...extraRollenFuerRang(rang)
    ];

    const rollen = [];

    for (const rollenName of rollenNamen) {

        const rolle = rolleFinden(
            member.guild,
            rollenName
        );

        if (!rolle) {
            throw new Error(
                `Die Discord-Rolle "${rollenName}" wurde nicht gefunden.`
            );
        }

        rollen.push(rolle);
    }

    await member.roles.add(rollen);
}

// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [

    // --------------------------------------------------
    // PING
    // --------------------------------------------------

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Zeigt die Bot-Latenz an."),

    // --------------------------------------------------
    // PERSONAL EINSTELLEN
    // --------------------------------------------------

    new SlashCommandBuilder()
        .setName("personal")
        .setDescription("US-Army Personalverwaltung")

        .addSubcommand(subcommand =>
            subcommand
                .setName("einstellen")
                .setDescription("Stellt ein Mitglied in die U.S.Army ein.")

                .addUserOption(option =>
                    option
                        .setName("mitglied")
                        .setDescription("Das einzustellende Discord-Mitglied.")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("ic_name")
                        .setDescription("Der IC-Name.")
                        .setRequired(true)
                )

                .addIntegerOption(option =>
                    option
                        .setName("rang")
                        .setDescription("Der Rang des Mitglieds.")
                        .setRequired(true)
                        .addChoices(
                            {
                                name: "[21] General of the Army",
                                value: 21
                            },
                            {
                                name: "[20] General",
                                value: 20
                            },
                            {
                                name: "[19] Lieutnant General",
                                value: 19
                            },
                            {
                                name: "[18] Captain",
                                value: 18
                            },
                            {
                                name: "[17] First Lieutenant",
                                value: 17
                            },
                            {
                                name: "[16] Second Lieutenant",
                                value: 16
                            },
                            {
                                name: "[15] Chief Warrant Officer III",
                                value: 15
                            },
                            {
                                name: "[14] Chief Warrant Officer II",
                                value: 14
                            },
                            {
                                name: "[13] Chief Warrant Officer I",
                                value: 13
                            },
                            {
                                name: "[12] Warrant Officer II",
                                value: 12
                            },
                            {
                                name: "[11] Warrant Officer I",
                                value: 11
                            },
                            {
                                name: "[10] Command Sergeant Major",
                                value: 10
                            },
                            {
                                name: "[09] First Sergeant",
                                value: 9
                            },
                            {
                                name: "[08] Master Sergeant",
                                value: 8
                            },
                            {
                                name: "[07] Sergeant First Class",
                                value: 7
                            },
                            {
                                name: "[06] Staff Sergeant",
                                value: 6
                            },
                            {
                                name: "[05] Sergeant",
                                value: 5
                            },
                            {
                                name: "[04] Corporal",
                                value: 4
                            },
                            {
                                name: "[03] Specialist",
                                value: 3
                            },
                            {
                                name: "[02] Private First Class",
                                value: 2
                            },
                            {
                                name: "[01] Private Second Class",
                                value: 1
                            }
                        )
                )
        )

        // --------------------------------------------------
        // PERSONAL ENTLASSEN
        // --------------------------------------------------

        .addSubcommand(subcommand =>
            subcommand
                .setName("entlassen")
                .setDescription("Entlässt ein Mitglied aus der U.S.Army.")

                .addUserOption(option =>
                    option
                        .setName("mitglied")
                        .setDescription("Das zu entlassende Mitglied.")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("ic_name")
                        .setDescription("Der IC-Name.")
                        .setRequired(true)
                )

                .addStringOption(option =>
                    option
                        .setName("grund")
                        .setDescription("Grund der Kündigung.")
                        .setRequired(true)
                )
        )

        // --------------------------------------------------
        // PERSONAL UPRANK
        // --------------------------------------------------

        .addSubcommand(subcommand =>
            subcommand
                .setName("uprank")
                .setDescription("Befördert ein Mitglied.")

                .addUserOption(option =>
                    option
                        .setName("mitglied")
                        .setDescription("Das zu befördernde Mitglied.")
                        .setRequired(true)
                )

                .addIntegerOption(option =>
                    option
                        .setName("alter_rang")
                        .setDescription("Der aktuelle Rang.")
                        .setRequired(true)
                        .addChoices(
                            { name: "[21] General of the Army", value: 21 },
                            { name: "[20] General", value: 20 },
                            { name: "[19] Lieutnant General", value: 19 },
                            { name: "[18] Captain", value: 18 },
                            { name: "[17] First Lieutenant", value: 17 },
                            { name: "[16] Second Lieutenant", value: 16 },
                            { name: "[15] Chief Warrant Officer III", value: 15 },
                            { name: "[14] Chief Warrant Officer II", value: 14 },
                            { name: "[13] Chief Warrant Officer I", value: 13 },
                            { name: "[12] Warrant Officer II", value: 12 },
                            { name: "[11] Warrant Officer I", value: 11 },
                            { name: "[10] Command Sergeant Major", value: 10 },
                            { name: "[09] First Sergeant", value: 9 },
                            { name: "[08] Master Sergeant", value: 8 },
                            { name: "[07] Sergeant First Class", value: 7 },
                            { name: "[06] Staff Sergeant", value: 6 },
                            { name: "[05] Sergeant", value: 5 },
                            { name: "[04] Corporal", value: 4 },
                            { name: "[03] Specialist", value: 3 },
                            { name: "[02] Private First Class", value: 2 },
                            { name: "[01] Private Second Class", value: 1 }
                        )
                )

                .addIntegerOption(option =>
                    option
                        .setName("neuer_rang")
                        .setDescription("Der neue Rang.")
                        .setRequired(true)
                        .addChoices(
                            { name: "[21] General of the Army", value: 21 },
                            { name: "[20] General", value: 20 },
                            { name: "[19] Lieutnant General", value: 19 },
                            { name: "[18] Captain", value: 18 },
                            { name: "[17] First Lieutenant", value: 17 },
                            { name: "[16] Second Lieutenant", value: 16 },
                            { name: "[15] Chief Warrant Officer III", value: 15 },
                            { name: "[14] Chief Warrant Officer II", value: 14 },
                            { name: "[13] Chief Warrant Officer I", value: 13 },
                            { name: "[12] Warrant Officer II", value: 12 },
                            { name: "[11] Warrant Officer I", value: 11 },
                            { name: "[10] Command Sergeant Major", value: 10 },
                            { name: "[09] First Sergeant", value: 9 },
                            { name: "[08] Master Sergeant", value: 8 },
                            { name: "[07] Sergeant First Class", value: 7 },
                            { name: "[06] Staff Sergeant", value: 6 },
                            { name: "[05] Sergeant", value: 5 },
                            { name: "[04] Corporal", value: 4 },
                            { name: "[03] Specialist", value: 3 },
                            { name: "[02] Private First Class", value: 2 },
                            { name: "[01] Private Second Class", value: 1 }
                        )
                )

                .addStringOption(option =>
                    option
                        .setName("grund")
                        .setDescription("Grund der Beförderung.")
                        .setRequired(true)
                )
        )
];

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

    console.log(`✅ Bot ist online als ${client.user.tag}`);

    try {

        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: commands.map(command =>
                    command.toJSON()
                )
            }
        );

        console.log("✅ Slash Commands wurden registriert.");

    } catch (error) {

        console.error(
            "❌ Fehler beim Registrieren der Commands:",
            error
        );
    }
});

// ======================================================
// INTERACTIONS
// ======================================================

client.on("interactionCreate", async interaction => {

    if (!interaction.isChatInputCommand()) {
        return;
    }

    // ==================================================
    // PING
    // ==================================================

    if (interaction.commandName === "ping") {

        await interaction.reply({
            content: `🏓 Pong! ${client.ws.ping}ms`
        });

        return;
    }

    if (interaction.commandName !== "personal") {
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    // ==================================================
    // PERSONAL EINSTELLEN
    // ==================================================

    if (subcommand === "einstellen") {

        const mitglied =
            interaction.options.getMember("mitglied");

        const user =
            interaction.options.getUser("mitglied");

        const icName =
            interaction.options.getString("ic_name");

        const rang =
            interaction.options.getInteger("rang");

        if (!mitglied) {

            await interaction.reply({
                content: "❌ Das Mitglied konnte nicht gefunden werden.",
                ephemeral: true
            });

            return;
        }

        await interaction.deferReply();

        try {

            const personal = personalLaden();

            // Prüfen, ob bereits eingestellt
            const bereitsVorhanden = personal.find(
                person => person.userId === user.id
            );

            if (bereitsVorhanden) {

                await interaction.editReply({
                    content:
                        "❌ Dieses Mitglied ist bereits in der U.S.Army."
                });

                return;
            }

            // Dienstnummer bestimmen
            const dienstnummer =
                dienstnummerErmitteln(
                    rang,
                    personal
                );

            if (!dienstnummer) {

                await interaction.editReply({
                    content:
                        `❌ Der Rang **[${String(rang).padStart(2, "0")}] ${RANG_NAMEN[rang]}** ist voll bzw. es ist keine Dienstnummer verfügbar.`
                });

                return;
            }

            // Original-Nickname speichern
            const originalNickname =
                mitglied.nickname || null;

            // Alte Army-Rollen entfernen
            await alteArmyRollenEntfernen(
                mitglied
            );

            // Neue Rollen setzen
            await rollenFuerRangSetzen(
                mitglied,
                rang
            );

            // Neuer Nickname
            let neuerNickname =
                `[ARMY-${dienstnummer}] ${icName}`;

            if (neuerNickname.length > 32) {
                neuerNickname =
                    neuerNickname.substring(0, 32);
            }

            try {
                await mitglied.setNickname(
                    neuerNickname
                );
            } catch (nicknameError) {
                console.log(
                    "⚠️ Nickname konnte nicht geändert werden:",
                    nicknameError.message
                );
            }

            // Personal speichern
            personal.push({
                userId: user.id,
                discordName: user.tag,
                icName: icName,
                rang: rang,
                rangName: RANG_NAMEN[rang],
                dienstnummer: dienstnummer,
                originalNickname: originalNickname,
                eingestelltVon: interaction.user.id,
                eingestelltAm: new Date().toISOString()
            });

            personalSpeichern(personal);

            // Embed
            const embed =
                new EmbedBuilder()
                    .setTitle("🇺🇸 Personal eingestellt")
                    .setDescription(
                        `${user} wurde erfolgreich in die **U.S.Army** eingestellt.`
                    )
                    .addFields(
                        {
                            name: "🪪 Dienstnummer",
                            value: dienstnummer,
                            inline: true
                        },
                        {
                            name: "🎖️ Rang",
                            value:
                                `[${String(rang).padStart(2, "0")}] ${RANG_NAMEN[rang]}`,
                            inline: true
                        },
                        {
                            name: "🎭 IC Name",
                            value: icName,
                            inline: true
                        },
                        {
                            name: "🎮 Discord",
                            value: `${user}`,
                            inline: true
                        },
                        {
                            name: "👤 Eingestellt von",
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
                    .setImage(ARMY_BILD_URL)
                    .setFooter({
                        text: "US-Army | ExodusV"
                    })
                    .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ Fehler bei Personal einstellen:",
                error
            );

            await interaction.editReply({
                content:
                    `❌ Fehler beim Einstellen:\n\`${error.message}\``
            });
        }

        return;
    }

    // ==================================================
    // PERSONAL ENTLASSEN
    // ==================================================

    if (subcommand === "entlassen") {

        const mitglied =
            interaction.options.getMember("mitglied");

        const user =
            interaction.options.getUser("mitglied");

        const icName =
            interaction.options.getString("ic_name");

        const grund =
            interaction.options.getString("grund");

        if (!mitglied) {

            await interaction.reply({
                content:
                    "❌ Das Mitglied konnte nicht gefunden werden.",
                ephemeral: true
            });

            return;
        }

        await interaction.deferReply();

        try {

            const personal = personalLaden();

            const personIndex =
                personal.findIndex(
                    person => person.userId === user.id
                );

            if (personIndex === -1) {

                await interaction.editReply({
                    content:
                        "❌ Dieses Mitglied wurde nicht in der Personaldatei gefunden."
                });

                return;
            }

            const person =
                personal[personIndex];

            // Alle Rollen außer @everyone entfernen
            const rollenZumEntfernen =
                mitglied.roles.cache.filter(
                    role => role.name !== "@everyone"
                );

            if (rollenZumEntfernen.size > 0) {
                await mitglied.roles.remove(
                    rollenZumEntfernen
                );
            }

            // Bürger-Rolle finden
            const buergerRolle =
                rolleFinden(
                    interaction.guild,
                    EXTRA_ROLLEN.BURGER
                );

            if (!buergerRolle) {

                await interaction.editReply({
                    content:
                        `❌ Die Bürger-Rolle "${EXTRA_ROLLEN.BURGER}" wurde nicht gefunden.`
                });

                return;
            }

            // Bürger-Rolle geben
            await mitglied.roles.add(
                buergerRolle
            );

            // Original-Nickname wiederherstellen
            try {

                if (person.originalNickname) {

                    await mitglied.setNickname(
                        person.originalNickname
                    );

                } else {

                    await mitglied.setNickname(null);
                }

            } catch (nicknameError) {

                console.log(
                    "⚠️ Original-Nickname konnte nicht wiederhergestellt werden:",
                    nicknameError.message
                );
            }

            // Personal entfernen
            personal.splice(
                personIndex,
                1
            );

            personalSpeichern(personal);

            // Embed
            const embed =
                new EmbedBuilder()
                    .setTitle("🚨 Entlassung")
                    .setDescription(
                        `${user} wurde aus der Army entlassen.`
                    )
                    .addFields(
                        {
                            name: "🎮 Discord",
                            value: `${user}`,
                            inline: true
                        },
                        {
                            name: "🥽 IC Name",
                            value: icName,
                            inline: true
                        },
                        {
                            name: "🪪 Dienstnummer",
                            value: person.dienstnummer,
                            inline: true
                        },
                        {
                            name: "⚠️ Grund der Kündigung",
                            value: grund,
                            inline: false
                        },
                        {
                            name: "👋 Gekündigt von",
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
                    .setImage(ARMY_BILD_URL)
                    .setFooter({
                        text: "US-Army | ExodusV"
                    })
                    .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ Fehler bei Personal entlassen:",
                error
            );

            await interaction.editReply({
                content:
                    `❌ Fehler bei der Entlassung:\n\`${error.message}\``
            });
        }

        return;
    }

    // ==================================================
    // PERSONAL UPRANK
    // ==================================================

    if (subcommand === "uprank") {

        const mitglied =
            interaction.options.getMember("mitglied");

        const user =
            interaction.options.getUser("mitglied");

        const alterRang =
            interaction.options.getInteger("alter_rang");

        const neuerRang =
            interaction.options.getInteger("neuer_rang");

        const grund =
            interaction.options.getString("grund");

        if (!mitglied) {

            await interaction.reply({
                content:
                    "❌ Das Mitglied konnte nicht gefunden werden.",
                ephemeral: true
            });

            return;
        }

        await interaction.deferReply();

        try {

            const personal = personalLaden();

            const person =
                personal.find(
                    p => p.userId === user.id
                );

            if (!person) {

                await interaction.editReply({
                    content:
                        "❌ Dieses Mitglied befindet sich nicht in der Personaldatei."
                });

                return;
            }

            // Prüfen, ob alter Rang stimmt
            if (person.rang !== alterRang) {

                await interaction.editReply({
                    content:
                        `❌ Der gespeicherte Rang ist **[${String(person.rang).padStart(2, "0")}] ${RANG_NAMEN[person.rang]}** und nicht **[${String(alterRang).padStart(2, "0")}] ${RANG_NAMEN[alterRang]}**.`
                });

                return;
            }

            if (alterRang === neuerRang) {

                await interaction.editReply({
                    content:
                        "❌ Der neue Rang darf nicht derselbe wie der alte Rang sein."
                });

                return;
            }

            // Neue Dienstnummer bestimmen
            const neueDienstnummer =
                dienstnummerFuerUprank(
                    neuerRang,
                    personal,
                    person.dienstnummer
                );

            if (!neueDienstnummer) {

                await interaction.editReply({
                    content:
                        `❌ Der Rang **[${String(neuerRang).padStart(2, "0")}] ${RANG_NAMEN[neuerRang]}** ist voll bzw. es ist keine Dienstnummer verfügbar.`
                });

                return;
            }

            // Alte Army-Rollen entfernen
            await alteArmyRollenEntfernen(
                mitglied
            );

            // Neue Rollen geben
            await rollenFuerRangSetzen(
                mitglied,
                neuerRang
            );

            // Neuer Nickname
            let neuerNickname =
                `[ARMY-${neueDienstnummer}] ${person.icName}`;

            if (neuerNickname.length > 32) {
                neuerNickname =
                    neuerNickname.substring(0, 32);
            }

            try {

                await mitglied.setNickname(
                    neuerNickname
                );

            } catch (nicknameError) {

                console.log(
                    "⚠️ Nickname konnte beim Uprank nicht geändert werden:",
                    nicknameError.message
                );
            }

            // Personal aktualisieren
            person.rang =
                neuerRang;

            person.rangName =
                RANG_NAMEN[neuerRang];

            person.dienstnummer =
                neueDienstnummer;

            person.uprankVon =
                interaction.user.id;

            person.uprankAm =
                new Date().toISOString();

            personalSpeichern(personal);

            // Embed
            const embed =
                new EmbedBuilder()
                    .setTitle("📈 Beförderung")
                    .setDescription(
                        `${user} wurde erfolgreich befördert.`
                    )
                    .addFields(
                        {
                            name: "🎖️ Alter Rang",
                            value:
                                `[${String(alterRang).padStart(2, "0")}] ${RANG_NAMEN[alterRang]}`,
                            inline: true
                        },
                        {
                            name: "🎖️ Neuer Rang",
                            value:
                                `[${String(neuerRang).padStart(2, "0")}] ${RANG_NAMEN[neuerRang]}`,
                            inline: true
                        },
                        {
                            name: "🪪 Neue Dienstnummer",
                            value: neueDienstnummer,
                            inline: true
                        },
                        {
                            name: "🥽 IC Name",
                            value: person.icName,
                            inline: true
                        },
                        {
                            name: "⚠️ Grund",
                            value: grund,
                            inline: false
                        },
                        {
                            name: "👤 Befördert von",
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

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {

            console.error(
                "❌ Fehler beim Uprank:",
                error
            );

            await interaction.editReply({
                content:
                    `❌ Fehler beim Uprank:\n\`${error.message}\``
            });
        }

        return;
    }
});

// ======================================================
// FEHLER
// ======================================================

process.on("unhandledRejection", error => {
    console.error(
        "❌ Unhandled Rejection:",
        error
    );
});

process.on("uncaughtException", error => {
    console.error(
        "❌ Uncaught Exception:",
        error
    );
});

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);
