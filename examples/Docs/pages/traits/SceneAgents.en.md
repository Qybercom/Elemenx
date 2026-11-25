<!-- generated -->
# SceneAgents

SceneAgents: what flies, drives or walks by a mind of its own: a tree of behaviour of the Blueprints Service (a graph of kind behaviour, run by its Agent), its tasks done here. An object is an agent with Values.Agent {Brain (a graph of the scene's Graphs or of the library: ai/fighter by default), Leader (the ID it flies by), Slot ([right, up, ahead] metres of the leader, [30, 0, -30]), Patrol (the IDs or the points of the world it goes round), Home (an ID or a point to go back to), Range (metres it sees, 4 times its weapon's), Every (seconds between its thoughts, 0.2), Closing (m/s it closes on or draws off from its enemy by at most, 1000), Run (metres of its runs at its enemy at most, 3000), Accel (m/s² its way changes by at most in a fight, 500: SceneVehicles)}; a ship of the player or a walker the player plays is none while it is played.

Each thought it knows (its board, the Input blocks of its tree read it): Health and Shield (0 to 1), Threat (how near the nearest of another team is, 0 to 1), Hurt (how hard it was hit lately, fading), EnemyNear, HasLeader, HasPatrol and its order (OrderAttack, OrderForm, OrderHold, OrderRetreat: 0 or 1), Incoming (how soon a missile meets it, SceneMissiles: 1 now, 0 in 8 seconds or more). Its tasks (Task blocks by Name): follow (its place by its leader), attack (runs at its enemy, its weapon fired while it is turned to it and in its range, its missiles launched at it locked, its torpedoes at one of Health Big (500) or more, its lance at it in its reach), evade (aside and away a while), defend (flares out and a hard turn across the way a missile comes), retreat (away from its enemy, or home), patrol (round its points), hold (on as it goes). A ship does them by its autopilot (SceneVehicles: Autopilot); its attack on a ship is on its tail, its nose on it. Of another team: of a Team of its own, else of the scene's (the hero and its ship); with no team, of none.

AgentOrder(ids, order, target) gives agents an order (attack: at target, or what they see; form: by their leader; hold; retreat; '' none): how many took it. AgentOf(id) is {Brain, Task, Board, Running, Order, Enemy}, null for no agent. The event agent tells a task begun: {ID, Task, Enemy}.

## Methods

- `AgentOrder(ids, order, target)`
- `AgentOf(id)`
