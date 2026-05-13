using GazeConnect.AACBoard.Core.Models;
using GazeConnect.AACBoard.Core.Resources;
using Mapster;
using BoardModel = GazeConnect.AACBoard.Core.Models.AACBoard;

namespace GazeConnect.AACBoard.Core.Mapping;

public static class BoardMappingConfig
{
    public static void Register()
    {
        TypeAdapterConfig<Button, ButtonDto>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.BoardId, src => src.BoardId)
            .Map(dest => dest.Text, src => src.Text)
            .Map(dest => dest.Category, src => src.Category)
            .Map(dest => dest.Icon, src => src.Icon)
            .Map(dest => dest.TtsText, src => src.TtsText)
            .Map(dest => dest.CreatedAt, src => src.CreatedAt)
            .Map(dest => dest.IsContextual, src => src.IsContextual)
            .Map(dest => dest.PersonId, src => src.PersonId);

        TypeAdapterConfig<BoardModel, BoardDto>.NewConfig()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.UserId, src => src.UserId)
            .Map(dest => dest.Name, src => src.Name)
            .Map(dest => dest.Layout, src => src.Layout)
            .Map(dest => dest.Buttons, src => src.Buttons.Adapt<IReadOnlyList<ButtonDto>>())
            .Map(dest => dest.CreatedAt, src => src.CreatedAt)
            .Map(dest => dest.UpdatedAt, src => src.UpdatedAt);
    }
}
