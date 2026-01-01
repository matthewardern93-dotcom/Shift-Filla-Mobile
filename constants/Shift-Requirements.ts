import { OptionType } from "@/components/ui/multi-select";

/**
 * A utility function to create an array of OptionType objects from an array of strings.
 * Each string is converted into an object with 'value' and 'label' properties.
 * @param options - An array of strings, where each string is a requirement label.
 * @returns An array of OptionType objects.
 */
const createOptions = (options: string[]): OptionType[] => {
    return options.map(option => ({
        value: option.toLowerCase().replace(/\s+/g, '-'), // a slug-like value
        label: option
    }));
};

// The master object containing all selectable requirements for each job role.
const requirements = {
    bartender: createOptions(['Cocktail knowledge', 'Dispense', 'Events', 'Nightclub', 'Pos knowledge', 'Solo work', 'Speed service', 'Wine knowledge']),
    barista: createOptions(['Dialing in', 'Events', 'Grinder adjustment', 'High volume', 'Latte art', 'Machine cleaning', 'Pos knowledge', 'Solo work']),
    'bar-back': createOptions(['Cleaning', 'Clearing', 'Events', 'Glass washing', 'Ice', 'Restocking']),
    'front-of-house': createOptions(['3 plate carry', 'Events', 'Fine dining', 'High volume', 'Maintain a section', 'Pos knowledge', 'Wine knowledge']),
    host: createOptions(['Greeting Guests', 'Managing Reservations', 'Seating Guests', 'Answering Phones']),
    events: createOptions(['Crowd Control', 'Ticket Scanning', 'Setup & Packdown']),
    'tourism-reception': createOptions(['Booking Systems', 'Customer Service', 'Local Knowledge']),
    chef: createOptions(['Cleaning', 'Desserts', 'Events', 'Grill', 'Pass', 'Prep']),
    'kitchen-hand': createOptions(['Basic Prep', 'Cleaning', 'Events']),
    dishwasher: createOptions(['Basic prep', 'Cleaning', 'Events', 'Restocking Cutlery', 'Restocking plates']),
};

/**
 * Retrieves the list of requirements for a given role.
 * It can also dynamically inject a specific POS system into the requirement label if one is provided.
 * @param roleId - The identifier for the role (e.g., 'barista', 'chef').
 * @param posSystem - Optional. The name of the Point of Sale system to include in the label.
 * @returns An array of OptionType objects for the specified role.
 */
export const getRoleRequirements = (roleId: string, posSystem?: string): OptionType[] => {
    // @ts-ignore
    let roleRequirements = requirements[roleId] || [];

    if (posSystem) {
        // Find the 'Pos knowledge' option and update its label
        roleRequirements = roleRequirements.map((req: OptionType) => {
            if (req.value === 'pos-knowledge') {
                return { ...req, label: `POS: ${posSystem}` };
            }
            return req;
        });
    }

    return roleRequirements;
};