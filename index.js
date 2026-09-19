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

// =====================================================
// KONFIGURATION
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN fehlt.");
    process.exit(1);
}

const DATA_FILE = path.join(__dirname, "personal.json");

// Dein vorhandenes Army-Bild
const ARMY_BILD_URL =
    "https://cdn.discordapp.com/attachments/1549718870691160115/1550820644034322503/image-3.png?ex=6aafb9c6&is=6aae6846&hm=7f7cf2f66aaa643aaefb3269cd026a730025890c88b003f5c913dc298da4ac8b";

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =====================================================
// RÄNGE
// =====================================================

const RANG_CHOICES = [
    { name: "[21] General of the Army", value: "[21] General of the Army" },
    { name: "[20] General", value: "[20] General" },
    { name: "[19] Lieutnant General", value: "[19] Lieutnant General" },
    { name: "[18] Captain", value: "[18] Captain" },
    { name: "[17] First Lieutenant", value: "[17] First Lieutenant" },
    { name: "[16] Second Lieutenant", value: "[16] Second Lieutenant" },
    { name: "[15] Chief Warrant Officer III", value: "[15] Chief Warrant Officer III" },
    { name: "[14] Chief Warrant Officer II", value: "[14] Chief Warrant Officer II" },
    { name: "[13] Chief Warrant Officer I", value: "[13] Chief Warrant Officer I" },
    { name: "[12] Warrant Officer II", value: "[12] Warrant Officer II" },
    { name: "[11] Warrant Officer I", value: "[11] Warrant Officer I" },
    { name: "[10] Command Sergeant Major", value: "[10] Command Sergeant Major" },
    { name: "[09] First Sergeant", value: "[09] First Sergeant" },
    { name: "[08] Master Sergeant", value: "[08] Master Sergeant" },
    { name: "[07] Sergeant First Class", value: "[07] Sergeant First Class" },
    { name: "[06] Staff Sergeant", value: "[06] Staff Sergeant" },
    { name: "[05] Sergeant", value: "[05] Sergeant" },
    { name: "[04] Corporal", value: "[04] Corporal" },
    { name: "[03] Specialist", value: "[03] Specialist" },
    { name: "[02] Private First Class", value: "[02] Private First Class" },
    { name: "[01] Private Second Class", value: "[01] Private Second Class" }
];

// =====================================================
// ROLLEN
// =====================================================

const ROLLEN = {
    army: "U.S.Army",
    buerger: "Bürger",

    general: "General",
    fieldGradeOfficer: "Field Grade Officer",
    hauptleute: "Hauptleute",
    leutnant: "Leutnant",
    unteroffiziere: "Unteroffiziere",
    mannschaft: "Mannschaft",
    abteilungen: "Abteilungen"
};

// =====================================================
// PERSONAL.JSON
// =====================================================

function personalLaden() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            const daten = {
                personal: []
            };

            fs.writeFileSync(
                DATA_FILE,
                JSON.stringify(daten, null, 2),
                "utf8"
            );

            return daten;
        }

        const daten = JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

        if (!daten || !Array.isArray(daten.personal)) {
            return {
                personal: []
            };
        }

        return daten;
    } catch (error) {
        console.error(
            "❌ Fehler beim Laden von personal.json:",
            error
        );

        return {
            personal: []
        };
    }
}

function personalSpeichern(daten) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(daten, null, 2),
        "utf8"
    );
}

// =====================================================
// HILFSFUNKTIONEN
// =====================================================

function rangNummer(rang) {
    const match = String(rang).match(/^\[(\d+)\]/);

    return match ? Number(match[1]) : 0;
}

function rolleFinden(guild, name) {
    return guild.roles.cache.find(
        role => role.name === name
    );
}

function datumDeutsch() {
    return new Date().toLocaleString("de-DE", {
        dateStyle: "short",
        timeStyle: "medium"
    });
}

function nicknameErstellen(icName, dienstnummer) {
    const nickname =
        `[ARMY-${dienstnummer}] ${icName}`;

    if (nickname.length <= 32) {
        return nickname;
    }

    return nickname.substring(0, 32);
}

// =====================================================
// ZUSATZROLLEN JE NACH RANG
// =====================================================

function zusatzRollenFuerRang(rang) {
    const nummer = rangNummer(rang);

    const rollen = [
        ROLLEN.army,
        ROLLEN.abteilungen
    ];

    // 21-19
    if (nummer >= 19 && nummer <= 21) {
        rollen.push(
            ROLLEN.mannschaft,
            ROLLEN.unteroffiziere,
            ROLLEN.leutnant,
            ROLLEN.hauptleute,
            ROLLEN.fieldGradeOfficer,
            ROLLEN.general
        );
    }

    // 18-16
    else if (nummer >= 16 && nummer <= 18) {
        rollen.push(
            ROLLEN.mannschaft,
            ROLLEN.unteroffiziere,
            ROLLEN.leutnant,
            ROLLEN.hauptleute,
            ROLLEN.fieldGradeOfficer
        );
    }

    // 15-14
    else if (nummer >= 14 && nummer <= 15) {
        rollen.push(
            ROLLEN.mannschaft,
            ROLLEN.unteroffiziere,
            ROLLEN.leutnant,
            ROLLEN.hauptleute
        );
    }

    // 13-12
    else if (nummer >= 12 && nummer <= 13) {
        rollen.push(
            ROLLEN.mannschaft,
            ROLLEN.unteroffiziere,
            ROLLEN.leutnant
        );
    }

    // 11-5
    else if (nummer >= 5 && nummer <= 11) {
        rollen.push(
            ROLLEN.mannschaft,
            ROLLEN.unteroffiziere
        );
    }

    // 4-1
    else {
        rollen.push(
            ROLLEN.mannschaft
        );
    }

    return [...new Set(rollen)];
}

// =====================================================
// DIENSTNUMMER BEI EINSTELLUNG
// =====================================================

function dienstnummerErmitteln(personal, rang) {
    const nummer = rangNummer(rang);

    let moeglicheNummern = [];

    // Rang 21
    if (nummer === 21) {
        moeglicheNummern = [
            "01",
            "02"
        ];
    }

    // Rang 20
    else if (nummer === 20) {
        moeglicheNummern = [
            "03",
            "04"
        ];
    }

    // Rang 19
    else if (nummer === 19) {
        moeglicheNummern = [
            "05",
            "06"
        ];
    }

    // Rang 18-1
    else {
        for (let i = 7; i <= 99; i++) {
            moeglicheNummern.push(
                String(i).padStart(2, "0")
            );
        }
    }

    const vergebeneNummern = new Set(
        personal.personal.map(
            person => String(person.dienstnummer)
        )
    );

    const freieNummern =
        moeglicheNummern.filter(
            nummer =>
                !vergebeneNummern.has(nummer)
        );

    if (freieNummern.length === 0) {
        return null;
    }

    // Bei 21, 20, 19 immer zuerst die niedrigste
    if (nummer >= 19) {
        return freieNummern[0];
    }

    // Bei 18-1 zufällige freie Nummer
    return freieNummern[
        Math.floor(
            Math.random() * freieNummern.length
        )
    ];
}

// =====================================================
// DIENSTNUMMER BEI UPRANK
// =====================================================

function dienstnummerFuerUprank(
    personal,
    neuerRang,
    alteDienstnummer
) {
    const nummer = rangNummer(neuerRang);

    let moeglicheNummern = [];

    if (nummer === 21) {
        moeglicheNummern = [
            "01",
            "02"
        ];
    }

    else if (nummer === 20) {
        moeglicheNummern = [
            "03",
            "04"
        ];
    }

    else if (nummer === 19) {
        moeglicheNummern = [
            "05",
            "06"
        ];
    }

    else {
        for (let i = 7; i <= 99; i++) {
            moeglicheNummern.push(
                String(i).padStart(2, "0")
            );
        }
    }

    const vergebeneNummern = new Set(
        personal.personal
            .filter(
                person =>
                    String(person.dienstnummer) !==
                    String(alteDienstnummer)
            )
            .map(
                person =>
                    String(person.dienstnummer)
            )
    );

    const freieNummern =
        moeglicheNummern.filter(
            nummer =>
                !vergebeneNummern.has(nummer)
        );

    if (freieNummern.length === 0) {
        return null;
    }

    if (nummer >= 19) {
        return freieNummern[0];
    }

    return freieNummern[
        Math.floor(
            Math.random() * freieNummern.length
        )
    ];
}

// =====================================================
// MEMBER HOLEN
// =====================================================

async function memberHolen(guild, userId) {
    try {
        return await guild.members.fetch(userId);
    } catch (error) {
        return null;
    }
}

// =====================================================
// ARMY-ROLLEN SETZEN
// =====================================================

async function armyRollenSetzen(
    member,
    rang
) {
    const benoetigteRollen =
        zusatzRollenFuerRang(rang);

    const alleArmyRollen = new Set([
        ROLLEN.army,
        ROLLEN.general,
        ROLLEN.fieldGradeOfficer,
        ROLLEN.hauptleute,
        ROLLEN.leutnant,
        ROLLEN.unteroffiziere,
        ROLLEN.mannschaft,
        ROLLEN.abteilungen,

        ...RANG_CHOICES.map(
            choice => choice.value
        )
    ]);

    // Alte Army-Rollen entfernen
    const alteRollen =
        member.roles.cache.filter(
            role =>
                alleArmyRollen.has(role.name)
        );

    for (const role of alteRollen.values()) {
        try {
            await member.roles.remove(role);
        } catch (error) {
            console.error(
                `❌ Konnte Rolle "${role.name}" nicht entfernen:`,
                error.message
            );
        }
    }

    const fehlendeRollen = [];

    // Neue Rollen setzen
    for (const rollenName of benoetigteRollen) {
        const role = rolleFinden(
            member.guild,
            rollenName
        );

        if (!role) {
            fehlendeRollen.push(
                rollenName
            );

            continue;
        }

        try {
            await member.roles.add(role);
        } catch (error) {
            console.error(
                `❌ Konnte Rolle "${rollenName}" nicht setzen:`,
                error.message
            );

            fehlendeRollen.push(
                rollenName
            );
        }
    }

    return fehlendeRollen;
}

// =====================================================
// SLASH COMMANDS
// =====================================================

const pingCommand =
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription(
            "Zeigt die Bot-Latenz."
        );

const personalCommand =
    new SlashCommandBuilder()
        .setName("personal")
        .setDescription(
            "Verwaltung des U.S.Army-Personals"
        )

        // ================================
        // EINSTELLEN
        // ================================

        .addSubcommand(
            subcommand =>
                subcommand
                    .setName("einstellen")
                    .setDescription(
                        "Stellt ein Mitglied in die U.S.Army ein."
                    )

                    .addUserOption(
                        option =>
                            option
                                .setName("mitglied")
                                .setDescription(
                                    "Das Discord-Mitglied."
                                )
                                .setRequired(true)
                    )

                    .addStringOption(
                        option =>
                            option
                                .setName("ic_name")
                                .setDescription(
                                    "Der IC-Name."
                                )
                                .setRequired(true)
                    )

                    .addStringOption(
                        option => {
                            option
                                .setName("rang")
                                .setDescription(
                                    "Der Army-Rang."
                                )
                                .setRequired(true);

                            option.addChoices(
                                ...RANG_CHOICES
                            );

                            return option;
                        }
                    )
        )

        // ================================
        // ENTLASSEN
        // ================================

        .addSubcommand(
            subcommand =>
                subcommand
                    .setName("entlassen")
                    .setDescription(
                        "Entlässt ein Mitglied aus der U.S.Army."
                    )

                    .addUserOption(
                        option =>
                            option
                                .setName("mitglied")
                                .setDescription(
                                    "Das Discord-Mitglied."
                                )
                                .setRequired(true)
                    )

                    .addStringOption(
                        option =>
                            option
                                .setName("ic_name")
                                .setDescription(
                                    "Der IC-Name."
                                )
                                .setRequired(true)
                    )

                    .addStringOption(
                        option =>
                            option
                                .setName("grund")
                                .setDescription(
                                    "Grund der Kündigung."
                                )
                                .setRequired(true)
                    )
        )

        // ================================
        // UPRANK
        // ================================

        .addSubcommand(
            subcommand =>
                subcommand
                    .setName("uprank")
                    .setDescription(
                        "Befördert ein Mitglied."
                    )

                    .addUserOption(
                        option =>
                            option
                                .setName("mitglied")
                                .setDescription(
                                    "Das Discord-Mitglied."
                                )
                                .setRequired(true)
                    )

                    .addStringOption(
                        option => {
                            option
                                .setName("alter_rang")
                                .setDescription(
                                    "Der bisherige Rang."
                                )
                                .setRequired(true);

                            option.addChoices(
                                ...RANG_CHOICES
                            );

                            return option;
                        }
                    )

                    .addStringOption(
                        option => {
                            option
                                .setName("neuer_rang")
                                .setDescription(
                                    "Der neue Rang."
                                )
                                .setRequired(true);

                            option.addChoices(
                                ...RANG_CHOICES
                            );

                            return option;
                        }
                    )

                    .addStringOption(
                        option =>
                            option
                                .setName("grund")
                                .setDescription(
                                    "Grund der Beförderung."
                                )
                                .setRequired(true)
                    )
        );

// =====================================================
// BOT READY
// =====================================================

client.once("ready", async () => {
    console.log(
        `✅ ${client.user.tag} ist online.`
    );

    try {
        const rest =
            new REST({
                version: "10"
            }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(
                client.user.id
            ),
            {
                body: [
                    pingCommand.toJSON(),
                    personalCommand.toJSON()
                ]
            }
        );

        console.log(
            "✅ Slash-Commands registriert."
        );
    } catch (error) {
        console.error(
            "❌ Fehler bei den Slash-Commands:",
            error
        );
    }
});

// =====================================================
// INTERACTIONS
// =====================================================

client.on(
    "interactionCreate",
    async interaction => {

        if (!interaction.isChatInputCommand()) {
            return;
        }

        // ================================
        // PING
        // ================================

        if (
            interaction.commandName ===
            "ping"
        ) {
            await interaction.reply(
                `🏓 Pong! ${client.ws.ping}ms`
            );

            return;
        }

        if (
            interaction.commandName !==
            "personal"
        ) {
            return;
        }

        const subcommand =
            interaction.options.getSubcommand();

        // =================================================
        // PERSONAL EINSTELLEN
        // =================================================

        if (
            subcommand ===
            "einstellen"
        ) {
            const user =
                interaction.options.getUser(
                    "mitglied"
                );

            const icName =
                interaction.options.getString(
                    "ic_name"
                );

            const rang =
                interaction.options.getString(
                    "rang"
                );

            const guild =
                interaction.guild;

            if (!guild) {
                await interaction.reply({
                    content:
                        "❌ Der Befehl funktioniert nur auf einem Server.",
                    ephemeral: true
                });

                return;
            }

            const member =
                await memberHolen(
                    guild,
                    user.id
                );

            if (!member) {
                await interaction.reply({
                    content:
                        "❌ Mitglied konnte nicht gefunden werden.",
                    ephemeral: true
                });

                return;
            }

            await interaction.deferReply();

            const personal =
                personalLaden();

            // Bereits eingestellt?
            const bereitsVorhanden =
                personal.personal.find(
                    person =>
                        person.userId ===
                        member.id
                );

            if (bereitsVorhanden) {
                await interaction.editReply({
                    content:
                        `❌ ${member} ist bereits in der U.S.Army.\n` +
                        `Dienstnummer: **${bereitsVorhanden.dienstnummer}**`
                });

                return;
            }

            // Dienstnummer
            const dienstnummer =
                dienstnummerErmitteln(
                    personal,
                    rang
                );

            if (!dienstnummer) {
                await interaction.editReply({
                    content:
                        `❌ Der Rang **${rang}** ist voll oder es ist keine Dienstnummer mehr frei.`
                });

                return;
            }

            // Rollen
            const rollenFehler =
                await armyRollenSetzen(
                    member,
                    rang
                );

            // Alten Nickname speichern
            const originalNickname =
                member.nickname;

            // Neuer Nickname
            try {
                await member.setNickname(
                    nicknameErstellen(
                        icName,
                        dienstnummer
                    )
                );
            } catch (error) {
                console.error(
                    "❌ Nickname konnte nicht gesetzt werden:",
                    error.message
                );
            }

            // Personal speichern
            personal.personal.push({
                userId: member.id,
                icName: icName,
                rang: rang,
                dienstnummer: dienstnummer,
                originalNickname: originalNickname,
                eingestelltVon:
                    interaction.user.id,
                eingestelltAm:
                    new Date().toISOString()
            });

            personalSpeichern(
                personal
            );

            // =================================================
            // EINSTELLUNGS-EMBED
            // DAS BILD IST GANZ UNTEN
            // =================================================

            const embed =
                new EmbedBuilder()
                    .setColor(0x1f2937)

                    .setTitle(
                        "🪖 Personal Einstellung"
                    )

                    .setDescription(
                        `${member} wurde erfolgreich in die **U.S.Army** eingestellt.`
                    )

                    .addFields(
                        {
                            name:
                                "🪪 Dienstnummer",
                            value:
                                `**${dienstnummer}**`,
                            inline: true
                        },
                        {
                            name:
                                "🎖️ Rang",
                            value:
                                rang,
                            inline: true
                        },
                        {
                            name:
                                "💚 IC Name",
                            value:
                                icName,
                            inline: true
                        },
                        {
                            name:
                                "👤 Discord",
                            value:
                                `${member}`,
                            inline: true
                        },
                        {
                            name:
                                "🤝 Eingestellt von",
                            value:
                                `${interaction.user}`,
                            inline: true
                        },
                        {
                            name:
                                "📅 Datum",
                            value:
                                datumDeutsch(),
                            inline: true
                        }
                    )

                    // DEIN BILD UNTEN IM EMBED
                    .setImage(
                        ARMY_BILD_URL
                    )

                    .setFooter({
                        text:
                            "US-Army | ExodusV"
                    })

                    .setTimestamp();

            let antwort =
                `✅ ${member} wurde erfolgreich eingestellt.\n` +
                `🪪 Dienstnummer: **${dienstnummer}**`;

            if (
                rollenFehler.length > 0
            ) {
                antwort +=
                    `\n\n⚠️ Folgende Rollen konnten nicht gesetzt werden:\n` +
                    rollenFehler
                        .map(
                            rolle =>
                                `• ${rolle}`
                        )
                        .join("\n");
            }

            await interaction.editReply({
                content: antwort,
                embeds: [embed]
            });

            return;
        }

        // =================================================
        // PERSONAL ENTLASSEN
        // =================================================

        if (
            subcommand ===
            "entlassen"
        ) {
            const user =
                interaction.options.getUser(
                    "mitglied"
                );

            const icName =
                interaction.options.getString(
                    "ic_name"
                );

            const grund =
                interaction.options.getString(
                    "grund"
                );

            const guild =
                interaction.guild;

            if (!guild) {
                await interaction.reply({
                    content:
                        "❌ Der Befehl funktioniert nur auf einem Server.",
                    ephemeral: true
                });

                return;
            }

            const member =
                await memberHolen(
                    guild,
                    user.id
                );

            if (!member) {
                await interaction.reply({
                    content:
                        "❌ Mitglied konnte nicht gefunden werden.",
                    ephemeral: true
                });

                return;
            }

            await interaction.deferReply();

            const personal =
                personalLaden();

            const index =
                personal.personal.findIndex(
                    person =>
                        person.userId ===
                        member.id
                );

            if (index === -1) {
                await interaction.editReply({
                    content:
                        `❌ ${member} ist nicht in der Personalakte eingetragen.`
                });

                return;
            }

            const person =
                personal.personal[index];

            // IC-Name prüfen
            if (
                String(
                    person.icName
                ).trim().toLowerCase() !==
                String(
                    icName
                ).trim().toLowerCase()
            ) {
                await interaction.editReply({
                    content:
                        "❌ Der angegebene IC-Name stimmt nicht mit der Personalakte überein."
                });

                return;
            }

            // Bürger-Rolle
            const buergerRolle =
                rolleFinden(
                    guild,
                    ROLLEN.buerger
                );

            if (!buergerRolle) {
                await interaction.editReply({
                    content:
                        `❌ Die Rolle **${ROLLEN.buerger}** wurde nicht gefunden.`
                });

                return;
            }

            // Alle Rollen außer @everyone und Bürger entfernen
            const zuEntfernendeRollen =
                member.roles.cache.filter(
                    role =>
                        role.id !== guild.id &&
                        role.id !== buergerRolle.id
                );

            const rollenFehler = [];

            for (
                const role of
                zuEntfernendeRollen.values()
            ) {
                try {
                    await member.roles.remove(
                        role
                    );
                } catch (error) {
                    console.error(
                        `❌ Rolle "${role.name}" konnte nicht entfernt werden:`,
                        error.message
                    );

                    rollenFehler.push(
                        role.name
                    );
                }
            }

            // Bürger hinzufügen
            try {
                await member.roles.add(
                    buergerRolle
                );
            } catch (error) {
                console.error(
                    "❌ Bürger-Rolle konnte nicht gesetzt werden:",
                    error.message
                );
            }

            // Alten Nickname wiederherstellen
            try {
                await member.setNickname(
                    person.originalNickname ||
                    null
                );
            } catch (error) {
                console.error(
                    "❌ Nickname konnte nicht wiederhergestellt werden:",
                    error.message
                );
            }

            // Personalakte löschen
            personal.personal.splice(
                index,
                1
            );

            personalSpeichern(
                personal
            );

            // =================================================
            // ENTLASSUNGS-EMBED
            // DAS BILD IST GANZ UNTEN
            // =================================================

            const embed =
                new EmbedBuilder()
                    .setColor(0x8b0000)

                    .setTitle(
                        "🚨 Entlassung"
                    )

                    .setDescription(
                        `${member} wurde aus der **U.S.Army** entlassen.`
                    )

                    .addFields(
                        {
                            name:
                                "🎮 Discord",
                            value:
                                `${member}`,
                            inline: true
                        },
                        {
                            name:
                                "💚 IC Name",
                            value:
                                icName,
                            inline: true
                        },
                        {
                            name:
                                "🪪 Dienstnummer",
                            value:
                                `**${person.dienstnummer}**`,
                            inline: true
                        },
                        {
                            name:
                                "⚠️ Grund der Kündigung",
                            value:
                                grund,
                            inline: false
                        },
                        {
                            name:
                                "👋 Gekündigt von",
                            value:
                                `${interaction.user}`,
                            inline: true
                        },
                        {
                            name:
                                "📅 Datum",
                            value:
                                datumDeutsch(),
                            inline: true
                        }
                    )

                    // DEIN BILD UNTEN IM EMBED
                    .setImage(
                        ARMY_BILD_URL
                    )

                    .setFooter({
                        text:
                            "US-Army | ExodusV"
                    })

                    .setTimestamp();

            let antwort =
                `🚨 ${member} wurde erfolgreich aus der U.S.Army entlassen.\n` +
                `🪪 Dienstnummer **${person.dienstnummer}** wurde wieder freigegeben.`;

            if (
                rollenFehler.length > 0
            ) {
                antwort +=
                    `\n\n⚠️ Einige Rollen konnten wegen der Discord-Rollenhierarchie nicht entfernt werden:\n` +
                    rollenFehler
                        .map(
                            rolle =>
                                `• ${rolle}`
                        )
                        .join("\n");
            }

            await interaction.editReply({
                content: antwort,
                embeds: [embed]
            });

            return;
        }

        // =================================================
        // UPRANK
        // =================================================

        if (
            subcommand ===
            "uprank"
        ) {
            const user =
                interaction.options.getUser(
                    "mitglied"
                );

            const alterRang =
                interaction.options.getString(
                    "alter_rang"
                );

            const neuerRang =
                interaction.options.getString(
                    "neuer_rang"
                );

            const grund =
                interaction.options.getString(
                    "grund"
                );

            const guild =
                interaction.guild;

            if (!guild) {
                await interaction.reply({
                    content:
                        "❌ Der Befehl funktioniert nur auf einem Server.",
                    ephemeral: true
                });

                return;
            }

            const member =
                await memberHolen(
                    guild,
                    user.id
                );

            if (!member) {
                await interaction.reply({
                    content:
                        "❌ Mitglied konnte nicht gefunden werden.",
                    ephemeral: true
                });

                return;
            }

            await interaction.deferReply();

            if (
                alterRang ===
                neuerRang
            ) {
                await interaction.editReply({
                    content:
                        "❌ Alter und neuer Rang dürfen nicht identisch sein."
                });

                return;
            }

            const personal =
                personalLaden();

            const person =
                personal.personal.find(
                    entry =>
                        entry.userId ===
                        member.id
                );

            if (!person) {
                await interaction.editReply({
                    content:
                        `❌ ${member} ist nicht in der Personalakte eingetragen.`
                });

                return;
            }

            if (
                person.rang !==
                alterRang
            ) {
                await interaction.editReply({
                    content:
                        `❌ Der gespeicherte Rang stimmt nicht.\n\n` +
                        `Gespeichert: **${person.rang}**\n` +
                        `Angegeben: **${alterRang}**`
                });

                return;
            }

            const alteDienstnummer =
                String(
                    person.dienstnummer
                );

            const neueDienstnummer =
                dienstnummerFuerUprank(
                    personal,
                    neuerRang,
                    alteDienstnummer
                );

            if (!neueDienstnummer) {
                await interaction.editReply({
                    content:
                        `❌ Der neue Rang **${neuerRang}** ist voll oder es ist keine Dienstnummer mehr frei.\n` +
                        `Die Beförderung wurde nicht durchgeführt.`
                });

                return;
            }

            // Rollen ändern
            const rollenFehler =
                await armyRollenSetzen(
                    member,
                    neuerRang
                );

            // Personalakte aktualisieren
            person.rang =
                neuerRang;

            person.dienstnummer =
                neueDienstnummer;

            person.uprankVon =
                interaction.user.id;

            person.uprankAm =
                new Date().toISOString();

            personalSpeichern(
                personal
            );

            // Nickname aktualisieren
            try {
                await member.setNickname(
                    nicknameErstellen(
                        person.icName,
                        neueDienstnummer
                    )
                );
            } catch (error) {
                console.error(
                    "❌ Nickname konnte nicht geändert werden:",
                    error.message
                );
            }

            // UPRANK EMBED
            const embed =
                new EmbedBuilder()
                    .setColor(0xb8860b)

                    .setTitle(
                        "🎖️ Rangänderung"
                    )

                    .setDescription(
                        `${member} wurde erfolgreich befördert.`
                    )

                    .addFields(
                        {
                            name:
                                "👤 Discord",
                            value:
                                `${member}`,
                            inline: true
                        },
                        {
                            name:
                                "📉 Alter Rang",
                            value:
                                alterRang,
                            inline: true
                        },
                        {
                            name:
                                "📈 Neuer Rang",
                            value:
                                neuerRang,
                            inline: true
                        },
                        {
                            name:
                                "🪪 Neue Dienstnummer",
                            value:
                                `**${neueDienstnummer}**`,
                            inline: true
                        },
                        {
                            name:
                                "📝 Grund",
                            value:
                                grund,
                            inline: false
                        },
                        {
                            name:
                                "🤝 Befördert von",
                            value:
                                `${interaction.user}`,
                            inline: true
                        },
                        {
                            name:
                                "📅 Datum",
                            value:
                                datumDeutsch(),
                            inline: true
                        }
                    )

                    .setFooter({
                        text:
                            "US-Army | ExodusV"
                    })

                    .setTimestamp();

            let antwort =
                `✅ ${member} wurde von **${alterRang}** auf **${neuerRang}** befördert.\n` +
                `🪪 Neue Dienstnummer: **${neueDienstnummer}**`;

            if (
                rollenFehler.length > 0
            ) {
                antwort +=
                    `\n\n⚠️ Folgende Rollen konnten nicht gesetzt werden:\n` +
                    rollenFehler
                        .map(
                            rolle =>
                                `• ${rolle}`
                        )
                        .join("\n");
            }

            await interaction.editReply({
                content: antwort,
                embeds: [embed]
            });

            return;
        }
    }
);

// =====================================================
// FEHLERBEHANDLUNG
// =====================================================

client.on(
    "error",
    error => {
        console.error(
            "❌ Discord-Client-Fehler:",
            error
        );
    }
);

process.on(
    "unhandledRejection",
    error => {
        console.error(
            "❌ Unhandled Promise Rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {
        console.error(
            "❌ Uncaught Exception:",
            error
        );
    }
);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);
