using UnityEngine;
using System.Collections.Generic;

/**
 * SynthiaCity - Unity City Controller
 * ===================================
 *
 * Manages a single city (center) when the player enters it.
 * Generates the 3D environment from WorldEngine data.
 * Spawns NPCs, choice portals, and interactive elements.
 *
 * Attach this to a GameObject in the city scene.
 */
public class SynthiaCity : MonoBehaviour
{
    [Header("City Settings")]
    public string centerId;
    public string cityName;
    public string archetype;

    [Header("Environment")]
    public Material skyMaterial;
    public Material groundMaterial;
    public Light mainLight;
    public ParticleSystem atmosphereParticles;

    [Header("Prefabs")]
    public GameObject buildingPrefab;
    public GameObject gatePrefab;
    public GameObject npcPrefab;
    public GameObject choicePortalPrefab;
    public GameObject playerPrefab;

    [Header("Audio")]
    public AudioClip ambientSound;
    public AudioClip interactionSound;

    // Runtime
    private WorldData worldData;
    private List<GameObject> structures = new List<GameObject>();
    private List<GameObject> npcs = new List<GameObject>();
    private List<GameObject> portals = new List<GameObject>();
    private GameObject player;

    void Start()
    {
        LoadWorldData();
        GenerateEnvironment();
        SpawnStructures();
        SpawnNPCs();
        SpawnChoicePortals();
        SpawnPlayer();
        SetupAudio();
    }

    /**
     * Load world data from JSON.
     */
    void LoadWorldData()
    {
        // In production: load from file or API
        // For now: create from archetype
        worldData = GenerateWorldFromArchetype(archetype);
    }

    WorldData GenerateWorldFromArchetype(string arch)
    {
        var data = new WorldData();
        data.id = "world_" + arch;
        data.name = cityName;
        data.archetype = arch;

        // Environment based on archetype
        switch (arch)
        {
            case "avoidance":
                data.environment = new EnvironmentData
                {
                    sky = "stormy",
                    ground = "water",
                    lighting = "dim_blue",
                    atmosphere = "tense",
                    color = new float[] { 0.2f, 0.3f, 0.5f },
                    fog = 0.4f
                };
                break;
            case "repetition":
                data.environment = new EnvironmentData
                {
                    sky = "overcast",
                    ground = "earth",
                    lighting = "soft_gray",
                    atmosphere = "stagnant",
                    color = new float[] { 0.4f, 0.4f, 0.4f },
                    fog = 0.3f
                };
                break;
            case "initiation":
                data.environment = new EnvironmentData
                {
                    sky = "clear",
                    ground = "grass",
                    lighting = "bright_golden",
                    atmosphere = "fresh",
                    color = new float[] { 0.8f, 0.7f, 0.4f },
                    fog = 0.1f
                };
                break;
            case "transformation":
                data.environment = new EnvironmentData
                {
                    sky = "sunset",
                    ground = "lava",
                    lighting = "warm_orange",
                    atmosphere = "intense",
                    color = new float[] { 1.0f, 0.5f, 0.2f },
                    fog = 0.2f
                };
                break;
            default:
                data.environment = new EnvironmentData
                {
                    sky = "clear",
                    ground = "grass",
                    lighting = "bright",
                    atmosphere = "calm",
                    color = new float[] { 0.5f, 0.6f, 0.7f },
                    fog = 0.1f
                };
                break;
        }

        // NPCs
        data.npcs = new List<NPCData>
        {
            new NPCData { name = "The Mirror", role = "reflects truth", form = "reflective_humanoid", position = new float[] { 3f, 0, 3f } },
            new NPCData { name = "The Shadow", role = "represents fear", form = "dark_silhouette", position = new float[] { -3f, 0, 3f } },
            new NPCData { name = "The Guide", role = "offers wisdom", form = "elderly_wanderer", position = new float[] { 0, 0, -3f } }
        };

        // Choices
        data.choices = new List<ChoiceData>
        {
            new ChoiceData { text = "Face the challenge directly", line = 1, hexagram = 1, position = new float[] { 5f, 0, 0 } },
            new ChoiceData { text = "Wait and observe", line = 3, hexagram = 5, position = new float[] { 0, 0, 5f } },
            new ChoiceData { text = "Seek guidance first", line = 2, hexagram = 17, position = new float[] { -5f, 0, 0 } }
        };

        return data;
    }

    void GenerateEnvironment()
    {
        if (worldData == null || worldData.environment == null) return;

        var env = worldData.environment;

        // Sky
        if (skyMaterial != null)
        {
            skyMaterial.color = new Color(env.color[0], env.color[1], env.color[2]);
            RenderSettings.skybox = skyMaterial;
        }

        // Ground
        if (groundMaterial != null)
        {
            groundMaterial.color = new Color(env.color[0] * 0.5f, env.color[1] * 0.5f, env.color[2] * 0.5f);
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            ground.transform.localScale = new Vector3(20, 1, 20);
            ground.GetComponent<Renderer>().material = groundMaterial;
        }

        // Lighting
        if (mainLight != null)
        {
            mainLight.color = new Color(env.color[0], env.color[1], env.color[2]);
            mainLight.intensity = env.lighting.Contains("bright") ? 1.5f : 0.8f;
        }

        // Fog
        RenderSettings.fog = true;
        RenderSettings.fogDensity = env.fog * 0.01f;
        RenderSettings.fogColor = new Color(env.color[0], env.color[1], env.color[2]);

        // Particles
        if (atmosphereParticles != null)
        {
            var main = atmosphereParticles.main;
            main.startColor = new Color(env.color[0], env.color[1], env.color[2], 0.5f);
        }
    }

    void SpawnStructures()
    {
        // Spawn main building
        if (buildingPrefab != null)
        {
            GameObject building = Instantiate(buildingPrefab, Vector3.zero, Quaternion.identity);
            building.name = "MainBuilding";
            structures.Add(building);
        }

        // Spawn gate structures
        if (worldData.gates != null)
        {
            foreach (var gate in worldData.gates)
            {
                Vector3 pos = new Vector3(gate.position[0], gate.position[1], gate.position[2]);
                GameObject gateObj = Instantiate(gatePrefab, pos, Quaternion.identity);
                gateObj.name = $"Gate_{gate.gateNumber}";

                GateComponent gateComp = gateObj.AddComponent<GateComponent>();
                gateComp.gateNumber = gate.gateNumber;
                gateComp.hexagramName = gate.hexagramName;

                structures.Add(gateObj);
            }
        }
    }

    void SpawnNPCs()
    {
        if (worldData.npcs == null) return;

        foreach (var npcData in worldData.npcs)
        {
            Vector3 pos = new Vector3(npcData.position[0], npcData.position[1], npcData.position[2]);
            GameObject npcObj = Instantiate(npcPrefab, pos, Quaternion.identity);
            npcObj.name = npcData.name;

            NPCComponent npcComp = npcObj.AddComponent<NPCComponent>();
            npcComp.Initialize(npcData);

            npcs.Add(npcObj);
        }
    }

    void SpawnChoicePortals()
    {
        if (worldData.choices == null) return;

        foreach (var choice in worldData.choices)
        {
            Vector3 pos = new Vector3(choice.position[0], choice.position[1], choice.position[2]);
            GameObject portal = Instantiate(choicePortalPrefab, pos, Quaternion.identity);
            portal.name = $"Choice_{choice.line}";

            ChoicePortal portalComp = portal.AddComponent<ChoicePortal>();
            portalComp.Initialize(choice, this);

            // Color based on line number
            Renderer renderer = portal.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material.color = choice.line <= 3 ? 
                    new Color(0.2f, 0.5f, 1f) : new Color(1f, 0.5f, 0.2f);
            }

            portals.Add(portal);
        }
    }

    void SpawnPlayer()
    {
        if (playerPrefab != null)
        {
            player = Instantiate(playerPrefab, new Vector3(0, 1, -5), Quaternion.identity);
            player.name = "Player";

            // Add player controller
            player.AddComponent<PlayerController>();
        }
    }

    void SetupAudio()
    {
        if (ambientSound != null)
        {
            AudioSource ambient = gameObject.AddComponent<AudioSource>();
            ambient.clip = ambientSound;
            ambient.loop = true;
            ambient.volume = 0.3f;
            ambient.Play();
        }
    }

    /**
     * Handle player choice.
     */
    public void OnPlayerChoice(ChoiceData choice)
    {
        Debug.Log($"Player chose: {choice.text} (Line {choice.line}, Hexagram {choice.hexagram})");

        // Play interaction sound
        if (interactionSound != null)
        {
            AudioSource.PlayClipAtPoint(interactionSound, player.transform.position);
        }

        // Trigger outcome
        // In production: load outcome from AutoNovel, update DISEMINER, etc.

        // Return to body map after choice
        Invoke("ReturnToBodyMap", 3f);
    }

    void ReturnToBodyMap()
    {
        // In production: load body map scene
        Debug.Log("Returning to body map...");
    }
}

// Data classes
[System.Serializable]
public class WorldData
{
    public string id;
    public string name;
    public string archetype;
    public EnvironmentData environment;
    public List<NPCData> npcs;
    public List<GateData> gates;
    public List<ChoiceData> choices;
}

[System.Serializable]
public class EnvironmentData
{
    public string sky;
    public string ground;
    public string lighting;
    public string atmosphere;
    public float[] color;
    public float fog;
}

[System.Serializable]
public class NPCData
{
    public string name;
    public string role;
    public string form;
    public float[] position;
    public float[] vector;
}

[System.Serializable]
public class GateData
{
    public int gateNumber;
    public string hexagramName;
    public float[] position;
}

[System.Serializable]
public class ChoiceData
{
    public string text;
    public int line;
    public int hexagram;
    public float[] position;
    public string outcome;
    public string lesson;
}

// Components
public class NPCComponent : MonoBehaviour
{
    private NPCData data;

    public void Initialize(NPCData npcData)
    {
        data = npcData;

        // Set appearance based on form
        Renderer renderer = GetComponent<Renderer>();
        if (renderer != null)
        {
            switch (data.form)
            {
                case "reflective_humanoid":
                    renderer.material.color = new Color(0.8f, 0.8f, 0.9f);
                    renderer.material.SetFloat("_Metallic", 1f);
                    break;
                case "dark_silhouette":
                    renderer.material.color = new Color(0.1f, 0.1f, 0.1f);
                    break;
                case "elderly_wanderer":
                    renderer.material.color = new Color(0.6f, 0.5f, 0.4f);
                    break;
            }
        }
    }

    void OnMouseDown()
    {
        Debug.Log($"{data.name}: {data.role}");
        // In production: trigger dialogue, animation, etc.
    }
}

public class GateComponent : MonoBehaviour
{
    public int gateNumber;
    public string hexagramName;

    void OnMouseDown()
    {
        Debug.Log($"Gate {gateNumber}: {hexagramName}");
    }
}

public class ChoicePortal : MonoBehaviour
{
    private ChoiceData choice;
    private SynthiaCity city;

    public void Initialize(ChoiceData ch, SynthiaCity ct)
    {
        choice = ch;
        city = ct;

        // Add floating animation
        // Add glow effect
    }

    void OnMouseDown()
    {
        city.OnPlayerChoice(choice);
    }

    void Update()
    {
        // Float up and down
        float y = Mathf.Sin(Time.time * 2f) * 0.2f;
        transform.position = new Vector3(transform.position.x, y + 1f, transform.position.z);

        // Rotate slowly
        transform.Rotate(0, 30f * Time.deltaTime, 0);
    }
}

public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float rotateSpeed = 100f;

    void Update()
    {
        // Movement
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");

        Vector3 move = new Vector3(h, 0, v) * moveSpeed * Time.deltaTime;
        transform.Translate(move, Space.Self);

        // Mouse look
        if (Input.GetMouseButton(1))
        {
            float mouseX = Input.GetAxis("Mouse X") * rotateSpeed * Time.deltaTime;
            transform.Rotate(0, mouseX, 0);
        }

        // Interact
        if (Input.GetKeyDown(KeyCode.E))
        {
            Interact();
        }
    }

    void Interact()
    {
        Ray ray = new Ray(transform.position, transform.forward);
        if (Physics.Raycast(ray, out RaycastHit hit, 3f))
        {
            // Check for interactable components
            var npc = hit.collider.GetComponent<NPCComponent>();
            if (npc != null)
            {
                npc.SendMessage("OnMouseDown");
            }

            var portal = hit.collider.GetComponent<ChoicePortal>();
            if (portal != null)
            {
                portal.SendMessage("OnMouseDown");
            }
        }
    }
}
