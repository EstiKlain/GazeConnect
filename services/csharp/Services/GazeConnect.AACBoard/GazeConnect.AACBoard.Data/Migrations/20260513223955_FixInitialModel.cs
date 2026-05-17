using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GazeConnect.AACBoard.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixInitialModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsContextual",
                table: "Buttons",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "PersonId",
                table: "Buttons",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsContextual",
                table: "Buttons");

            migrationBuilder.DropColumn(
                name: "PersonId",
                table: "Buttons");
        }
    }
}
