import * as Yup from 'yup';
import { Op } from 'sequelize';

import Plan from '../models/Plan';

class PlanController {
  async index(req, res) {
    const { page = 1, quantity = 20, q: query = '' } = req.query;

    const { rows: plans, count } = await Plan.findAndCountAll({
      limit: quantity,
      offset: (page - 1) * quantity,
      where: {
        [Op.or]: [{ title: { [Op.iLike]: `%${query}%` } }],
      },
      order: [['price']],
    });

    return res.set({ total_pages: Math.ceil(count / quantity) }).json(plans);
  }

  async show(req, res) {
    const { id } = req.params;

    const plan = await Plan.findByPk(id);

    res.json(plan);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const plan = await Plan.create(req.body);

    return res.json(plan);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      duration: Yup.number().required(),
      price: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }

    const { id } = req.params;
    const { title, duration, price } = req.body;

    const plan = await Plan.findByPk(id);

    if (req.body.title !== plan.title) {
      const planExists = await Plan.findOne({ where: { title } });

      if (planExists) {
        return res
          .status(401)
          .json({ error: 'A plan with this name already exists' });
      }
    }

    await plan.update({ title, duration, price });
    await plan.save();

    return res.json(plan);
  }

  async delete(req, res) {
    const { id } = req.params;

    await Plan.destroy({ where: { id } });

    return res.send();
  }
}

export default new PlanController();
