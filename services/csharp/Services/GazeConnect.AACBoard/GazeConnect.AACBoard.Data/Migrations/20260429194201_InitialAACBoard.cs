using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GazeConnect.AACBoard.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialAACBoard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AACBoards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Layout = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AACBoards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BoardTriggers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BoardId = table.Column<Guid>(type: "uuid", nullable: false),
                    TriggerType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TriggerValue = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Condition = table.Column<string>(type: "jsonb", nullable: false),
                    ConfidenceWeight = table.Column<double>(type: "double precision", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    AACBoardId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BoardTriggers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BoardTriggers_AACBoards_AACBoardId",
                        column: x => x.AACBoardId,
                        principalTable: "AACBoards",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BoardTriggers_AACBoards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "AACBoards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Buttons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BoardId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Text = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Icon = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TtsText = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buttons", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buttons_AACBoards_BoardId",
                        column: x => x.BoardId,
                        principalTable: "AACBoards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsageLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ButtonId = table.Column<Guid>(type: "uuid", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Context = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsageLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsageLogs_Buttons_ButtonId",
                        column: x => x.ButtonId,
                        principalTable: "Buttons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BoardTriggers_AACBoardId",
                table: "BoardTriggers",
                column: "AACBoardId");

            migrationBuilder.CreateIndex(
                name: "IX_BoardTriggers_BoardId",
                table: "BoardTriggers",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_Buttons_BoardId",
                table: "Buttons",
                column: "BoardId");

            migrationBuilder.CreateIndex(
                name: "IX_UsageLogs_ButtonId",
                table: "UsageLogs",
                column: "ButtonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BoardTriggers");

            migrationBuilder.DropTable(
                name: "UsageLogs");

            migrationBuilder.DropTable(
                name: "Buttons");

            migrationBuilder.DropTable(
                name: "AACBoards");
        }
    }
}
