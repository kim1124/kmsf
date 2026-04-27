import { mapDashboardGridOptions } from "../../src";

describe("mapDashboardGridOptions", () => {
  it("maps dashboard interaction flags to GridStack options", () => {
    expect(mapDashboardGridOptions({ columns: 4, editable: false })).toMatchObject({
      column: 4,
      disableDrag: true,
      disableResize: true,
    });

    expect(mapDashboardGridOptions({ columns: 13, editable: true, movable: false, resizable: true })).toMatchObject({
      column: 12,
      disableDrag: true,
      disableResize: false,
    });
  });
});
