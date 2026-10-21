from __future__ import annotations

from fastapi.testclient import TestClient

from human_design.geonatal import calculate_geonatal
from human_design.web_api import HumanDesignWebStore, create_app


def test_node_geonatal_runtime_returns_all_frames_and_perspectives() -> None:
    payload = calculate_geonatal(
        "1988-10-09T12:30:00.000Z",
        latitude=31.2304,
        longitude=121.4737,
    )

    assert len(payload["placements"]) == 78
    assert set(payload["perspectives"]) == {
        "being",
        "movement",
        "evolution",
        "design",
        "space",
    }
    assert len(payload["perspectives"]["being"]) == 78
    assert payload["methods"]["draconic"].startswith("tropical longitude")


def test_geonatal_api_exposes_local_calculator() -> None:
    client = TestClient(create_app(HumanDesignWebStore()))
    response = client.post(
        "/api/geonatal",
        json={
            "timestamp": "1988-10-09T12:30:00.000Z",
            "latitude": 31.2304,
            "longitude": 121.4737,
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["houseMethod"] == "equal"
    assert {item["frame"] for item in payload["placements"]} == {
        "tropical",
        "sidereal_fagan_bradley",
        "draconic_tropical_true",
    }
