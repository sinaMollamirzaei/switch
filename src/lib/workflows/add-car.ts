import type {Car} from '../services';
import {carsService} from '../services';

export interface AddCarInput {
  car: Pick<Car, 'name' | 'plate'>;
}

export async function addCarWorkflow(input: AddCarInput): Promise<string> {
  // Step 1: Create the car
  await carsService.create(input.car);

  // Fetch the newly created car's id (create() does not return it — reload)
  const cars = await carsService.list();
  const newCar = cars.find((c) => c.licensePlate === input.car.plate);
  if (!newCar) throw new Error('[addCarWorkflow] Could not locate newly created car');

  return newCar.id;
}
